import { db, type Prisma, type VenueType } from "@rythmons/db";
import {
	MUSIC_GENRES,
	type VenueSearchInput,
	venueSchema,
	venueSearchSchema,
} from "@rythmons/validation";
import { z } from "zod";
import { geocodeAddress, haversineKm } from "../geocode";
import { getColumnAvailability } from "../prisma-compat";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const venueCompatColumns = [
	"paymentTypes",
	"budgetMin",
	"budgetMax",
	"techInfo",
] as const;

async function getVenueCompat(client: {
	$queryRaw: <T = unknown>(query: Prisma.Sql) => Promise<T>;
}) {
	return getColumnAvailability(client, "venue", venueCompatColumns);
}

function buildVenueSelect(
	compat: Awaited<ReturnType<typeof getVenueCompat>>,
	includeOwner: boolean,
): Prisma.VenueSelect {
	return {
		id: true,
		name: true,
		address: true,
		city: true,
		postalCode: true,
		country: true,
		venueType: true,
		capacity: true,
		description: true,
		photoUrl: true,
		logoUrl: true,
		images: true,
		paymentPolicy: true,
		ownerId: true,
		createdAt: true,
		updatedAt: true,
		latitude: true,
		longitude: true,
		...(compat.paymentTypes ? { paymentTypes: true } : {}),
		...(compat.budgetMin ? { budgetMin: true } : {}),
		...(compat.budgetMax ? { budgetMax: true } : {}),
		...(compat.techInfo ? { techInfo: true } : {}),
		genres: {
			select: {
				id: true,
				name: true,
			},
		},
		...(includeOwner
			? {
					owner: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				}
			: {}),
	};
}

function normalizeVenue<TVenue extends Record<string, unknown>>(
	venue: TVenue,
	compat: Awaited<ReturnType<typeof getVenueCompat>>,
) {
	return {
		...venue,
		...(compat.paymentTypes ? {} : { paymentTypes: [] }),
		...(compat.budgetMin ? {} : { budgetMin: null }),
		...(compat.budgetMax ? {} : { budgetMax: null }),
		...(compat.techInfo ? {} : { techInfo: null }),
	};
}

function sanitizeVenueData<TVenueData extends Record<string, unknown>>(
	data: TVenueData,
	compat: Awaited<ReturnType<typeof getVenueCompat>>,
): TVenueData {
	if (!compat.paymentTypes) {
		delete data.paymentTypes;
	}

	if (!compat.budgetMin) {
		delete data.budgetMin;
	}

	if (!compat.budgetMax) {
		delete data.budgetMax;
	}

	if (!compat.techInfo) {
		delete data.techInfo;
	}

	return data;
}

function buildGenreSearchFilter(genreNames: string[]) {
	if (genreNames.length === 0) {
		return undefined;
	}

	return {
		some: {
			OR: genreNames.map((genreName) => ({
				name: {
					equals: genreName,
					mode: "insensitive" as const,
				},
			})),
		},
	};
}

function buildVenueSearchWhere(
	input: VenueSearchInput,
): Prisma.VenueWhereInput | undefined {
	const query = input.query.trim();
	const city = input.city.trim();
	const postalCode = input.postalCode.trim();
	const andFilters: Prisma.VenueWhereInput[] = [];

	if (query) {
		andFilters.push({
			OR: [
				{ name: { contains: query, mode: "insensitive" } },
				{ city: { contains: query, mode: "insensitive" } },
				{ postalCode: { contains: query } },
				{ address: { contains: query, mode: "insensitive" } },
				{
					owner: {
						is: {
							name: { contains: query, mode: "insensitive" },
						},
					},
				},
				{
					genres: {
						some: {
							name: { contains: query, mode: "insensitive" },
						},
					},
				},
			],
		});
	}

	const genreFilter = buildGenreSearchFilter(input.genreNames);
	if (genreFilter) {
		andFilters.push({ genres: genreFilter });
	}

	if (city && !input.radiusKm) {
		andFilters.push({
			city: {
				contains: city,
				mode: "insensitive",
			},
		});
	}

	if (postalCode && !input.radiusKm) {
		andFilters.push({
			postalCode: {
				contains: postalCode,
			},
		});
	}

	if (input.venueTypes.length > 0) {
		andFilters.push({
			venueType: {
				in: input.venueTypes,
			},
		});
	}

	if (input.budgetMin != null) {
		andFilters.push({
			OR: [{ budgetMax: { gte: input.budgetMin } }, { budgetMax: null }],
		});
	}

	if (input.budgetMax != null) {
		andFilters.push({
			OR: [{ budgetMin: { lte: input.budgetMax } }, { budgetMin: null }],
		});
	}

	if (andFilters.length === 0) {
		return undefined;
	}

	return {
		AND: andFilters,
	};
}

export const venueRouter = router({
	// Get the current user's venues
	getMyVenues: protectedProcedure.query(async ({ ctx }) => {
		const compat = await getVenueCompat(db);
		const venues = await db.venue.findMany({
			where: {
				ownerId: ctx.session.user.id,
			},
			select: buildVenueSelect(compat, false),
		});
		return venues.map((venue) => normalizeVenue(venue, compat));
	}),

	// Get a venue by ID (public)
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const compat = await getVenueCompat(db);
			const venue = await db.venue.findUnique({
				where: { id: input.id },
				select: buildVenueSelect(compat, true),
			});
			return venue ? normalizeVenue(venue, compat) : null;
		}),

	// Get all available genres
	getAllGenres: publicProcedure.query(() => {
		return MUSIC_GENRES;
	}),

	// Search venues for artists
	search: protectedProcedure
		.input(venueSearchSchema)
		.query(async ({ input }) => {
			const compat = await getVenueCompat(db);

			const venues = await db.venue.findMany({
				where: buildVenueSearchWhere(input),
				select: buildVenueSelect(compat, true),
				orderBy: [{ name: "asc" }],
				// Increase limit when radius filtering so we have enough records to filter from
				take: input.radiusKm != null ? 500 : 24,
			});

			const normalized = venues.map((venue) => normalizeVenue(venue, compat));

			if (input.radiusKm != null) {
				let ref: { lat: number; lng: number } | null = null;
				if (input.userLat != null && input.userLng != null) {
					ref = { lat: input.userLat, lng: input.userLng };
				} else {
					const locationQuery = [input.city.trim(), input.postalCode.trim()]
						.filter(Boolean)
						.join(" ");
					ref = locationQuery ? await geocodeAddress(locationQuery) : null;
				}
				if (ref) {
					return normalized.filter((v) => {
						if (v.latitude == null || v.longitude == null) return false;
						return (
							haversineKm(ref.lat, ref.lng, v.latitude, v.longitude) <=
							(input.radiusKm as number)
						);
					});
				}
			}

			return normalized;
		}),

	// Create a new venue
	create: protectedProcedure
		.input(venueSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user already has a venue
			// Limit number of venues per user
			const venueCount = await db.venue.count({
				where: { ownerId: ctx.session.user.id },
			});

			if (venueCount >= 5) {
				throw new Error("Vous avez atteint la limite de 5 lieux.");
			}

			const compat = await getVenueCompat(db);
			const { genreNames, ...venueData } = input;
			const sanitizedVenueData = sanitizeVenueData({ ...venueData }, compat);
			console.log("Creating venue with data:", venueData); // SERVER DEBUG LOG

			// Create or connect genres
			const genreConnections =
				genreNames && genreNames.length > 0
					? await Promise.all(
							genreNames.map(async (name) => {
								const genre = await db.genre.upsert({
									where: { name },
									update: {},
									create: { name },
								});
								return { id: genre.id };
							}),
						)
					: [];

			const venue = await db.venue.create({
				data: {
					...sanitizedVenueData,
					venueType: venueData.venueType as VenueType,
					ownerId: ctx.session.user.id,
					genres: {
						connect: genreConnections,
					},
				},
				select: buildVenueSelect(compat, false),
			});

			// Geocode asynchronously after creation (fire-and-forget)
			const geoQuery = [venueData.city, venueData.postalCode]
				.filter(Boolean)
				.join(" ");
			if (geoQuery) {
				geocodeAddress(geoQuery).then((coords) => {
					if (coords) {
						db.venue
							.update({
								where: { id: venue.id },
								data: { latitude: coords.lat, longitude: coords.lng },
							})
							.catch(() => {});
					}
				});
			}

			return normalizeVenue(venue, compat);
		}),

	// Update an existing venue
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: venueSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const venue = await db.venue.findUnique({
				where: { id: input.id },
			});

			if (!venue) {
				throw new Error("Lieu non trouvé");
			}

			if (venue.ownerId !== ctx.session.user.id) {
				throw new Error("Vous n'êtes pas autorisé à modifier ce lieu");
			}

			const compat = await getVenueCompat(db);
			const { genreNames, ...venueData } = input.data;
			const sanitizedVenueData = sanitizeVenueData({ ...venueData }, compat);
			console.log("Updating venue with data:", venueData); // SERVER DEBUG LOG

			// Handle genres update if provided
			let genresUpdate = {};
			if (genreNames !== undefined) {
				const genreConnections =
					genreNames.length > 0
						? await Promise.all(
								genreNames.map(async (name) => {
									const genre = await db.genre.upsert({
										where: { name },
										update: {},
										create: { name },
									});
									return { id: genre.id };
								}),
							)
						: [];

				genresUpdate = {
					genres: {
						set: genreConnections,
					},
				};
			}

			const updatedVenue = await db.venue.update({
				where: { id: input.id },
				data: {
					...sanitizedVenueData,
					venueType: venueData.venueType as VenueType | undefined,
					...genresUpdate,
				},
				select: buildVenueSelect(compat, false),
			});

			// Re-geocode if city or postal code changed
			const geoQuery = [venueData.city, venueData.postalCode]
				.filter(Boolean)
				.join(" ");
			if (geoQuery) {
				geocodeAddress(geoQuery).then((coords) => {
					if (coords) {
						db.venue
							.update({
								where: { id: input.id },
								data: { latitude: coords.lat, longitude: coords.lng },
							})
							.catch(() => {});
					}
				});
			}

			return normalizeVenue(updatedVenue, compat);
		}),

	// Delete a venue
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const venue = await db.venue.findUnique({
				where: { id: input.id },
			});

			if (!venue) {
				throw new Error("Lieu non trouvé");
			}

			if (venue.ownerId !== ctx.session.user.id) {
				throw new Error("Vous n'êtes pas autorisé à supprimer ce lieu");
			}

			await db.venue.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
