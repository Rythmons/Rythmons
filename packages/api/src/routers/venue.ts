import { db, type Prisma, type VenueType } from "@rythmons/db";
import { MUSIC_GENRES, venueSchema } from "@rythmons/validation";
import { z } from "zod";
import { getColumnAvailability } from "../prisma-compat";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const venueSearchSchema = z.object({
	query: z.string().trim().max(100).default(""),
});

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
			const query = input.query.trim();
			const compat = await getVenueCompat(db);

			const venues = await db.venue.findMany({
				where: query
					? {
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
						}
					: undefined,
				select: buildVenueSelect(compat, true),
				orderBy: [{ name: "asc" }],
				take: 24,
			});

			return venues.map((venue) => normalizeVenue(venue, compat));
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
