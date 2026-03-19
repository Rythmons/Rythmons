import type { Prisma } from "@rythmons/db";
import {
	type ArtistSearchInput,
	artistSchema,
	artistSearchSchema,
} from "@rythmons/validation";
import { z } from "zod";
import { geocodeAddress, haversineKm } from "../geocode";
import { getColumnAvailability } from "../prisma-compat";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const artistCompatColumns = [
	"city",
	"postalCode",
	"socialLinks",
	"techRequirements",
	"feeMin",
	"feeMax",
	"isNegotiable",
] as const;

async function getArtistCompat(db: {
	$queryRaw: <T = unknown>(query: Prisma.Sql) => Promise<T>;
}) {
	return getColumnAvailability(db, "artist", artistCompatColumns);
}

function buildArtistSelect(
	compat: Awaited<ReturnType<typeof getArtistCompat>>,
): Prisma.ArtistSelect {
	return {
		id: true,
		userId: true,
		stageName: true,
		photoUrl: true,
		bannerUrl: true,
		bio: true,
		website: true,
		images: true,
		createdAt: true,
		updatedAt: true,
		latitude: true,
		longitude: true,
		...(compat.city ? { city: true } : {}),
		...(compat.postalCode ? { postalCode: true } : {}),
		...(compat.socialLinks ? { socialLinks: true } : {}),
		...(compat.techRequirements ? { techRequirements: true } : {}),
		...(compat.feeMin ? { feeMin: true } : {}),
		...(compat.feeMax ? { feeMax: true } : {}),
		...(compat.isNegotiable ? { isNegotiable: true } : {}),
		genres: {
			select: {
				id: true,
				name: true,
			},
		},
		user: {
			select: {
				id: true,
				name: true,
				image: true,
			},
		},
	};
}

function normalizeArtist<TArtist extends Record<string, unknown>>(
	artist: TArtist,
	compat: Awaited<ReturnType<typeof getArtistCompat>>,
) {
	return {
		...artist,
		...(compat.city ? {} : { city: null }),
		...(compat.postalCode ? {} : { postalCode: null }),
		...(compat.socialLinks ? {} : { socialLinks: null }),
		...(compat.techRequirements ? {} : { techRequirements: null }),
		...(compat.feeMin ? {} : { feeMin: null }),
		...(compat.feeMax ? {} : { feeMax: null }),
		...(compat.isNegotiable ? {} : { isNegotiable: false }),
	};
}

function sanitizeArtistData<TArtistData extends Record<string, unknown>>(
	data: TArtistData,
	compat: Awaited<ReturnType<typeof getArtistCompat>>,
): TArtistData {
	if (!compat.city) {
		delete data.city;
	}

	if (!compat.postalCode) {
		delete data.postalCode;
	}

	if (!compat.socialLinks) {
		delete data.socialLinks;
	}

	if (!compat.techRequirements) {
		delete data.techRequirements;
	}

	if (!compat.feeMin) {
		delete data.feeMin;
	}

	if (!compat.feeMax) {
		delete data.feeMax;
	}

	if (!compat.isNegotiable) {
		delete data.isNegotiable;
	}

	return data;
}

function buildArtistGenreSearchFilter(genreNames: string[]) {
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

function buildArtistSearchWhere(
	input: ArtistSearchInput,
	compat: Awaited<ReturnType<typeof getArtistCompat>>,
): Prisma.ArtistWhereInput | undefined {
	const query = input.query.trim();
	const city = input.city.trim();
	const postalCode = input.postalCode.trim();
	const andFilters: Prisma.ArtistWhereInput[] = [];

	if (query) {
		const orFilters: Prisma.ArtistWhereInput[] = [
			{ stageName: { contains: query, mode: "insensitive" } },
			{ bio: { contains: query, mode: "insensitive" } },
			{
				user: {
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
		];

		if (compat.city) {
			orFilters.push({ city: { contains: query, mode: "insensitive" } });
		}

		if (compat.postalCode) {
			orFilters.push({ postalCode: { contains: query } });
		}

		andFilters.push({ OR: orFilters });
	}

	const genreFilter = buildArtistGenreSearchFilter(input.genreNames);
	if (genreFilter) {
		andFilters.push({ genres: genreFilter });
	}

	if (city && compat.city && !input.radiusKm) {
		andFilters.push({
			city: {
				contains: city,
				mode: "insensitive",
			},
		});
	}

	if (postalCode && compat.postalCode && !input.radiusKm) {
		andFilters.push({
			postalCode: {
				contains: postalCode,
			},
		});
	}

	if (input.feeMin != null && compat.feeMax) {
		andFilters.push({
			OR: [{ feeMax: { gte: input.feeMin } }, { feeMax: null }],
		});
	}

	if (input.feeMax != null && compat.feeMin) {
		andFilters.push({
			OR: [{ feeMin: { lte: input.feeMax } }, { feeMin: null }],
		});
	}

	if (andFilters.length === 0) {
		return undefined;
	}

	return {
		AND: andFilters,
	};
}

export const artistRouter = router({
	myArtists: protectedProcedure.query(async ({ ctx }) => {
		const compat = await getArtistCompat(ctx.db);
		const artists = await ctx.db.artist.findMany({
			where: { userId: ctx.session.user.id },
			select: buildArtistSelect(compat),
		});

		return artists.map((artist) => normalizeArtist(artist, compat));
	}),

	// Public artist profile
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const compat = await getArtistCompat(ctx.db);
			const artist = await ctx.db.artist.findUnique({
				where: { id: input.id },
				select: buildArtistSelect(compat),
			});

			return artist ? normalizeArtist(artist, compat) : null;
		}),

	search: protectedProcedure
		.input(artistSearchSchema)
		.query(async ({ ctx, input }) => {
			const compat = await getArtistCompat(ctx.db);
			const artists = await ctx.db.artist.findMany({
				where: buildArtistSearchWhere(input, compat),
				select: buildArtistSelect(compat),
				orderBy: [{ stageName: "asc" }],
				take: input.radiusKm != null ? 500 : 24,
			});

			let normalized = artists.map((artist) => normalizeArtist(artist, compat));

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
					normalized = normalized.filter((a) => {
						if (a.latitude == null || a.longitude == null) return false;
						return (
							haversineKm(ref.lat, ref.lng, a.latitude, a.longitude) <=
							(input.radiusKm as number)
						);
					});
				}
			}

			// US20: filter by availability date — exclude artists with UNAVAILABLE or BOOKED on that day
			if (input.availabilityDate?.trim()) {
				const dayStart = new Date(
					`${input.availabilityDate.trim()}T00:00:00.000Z`,
				);
				const dayEnd = new Date(
					`${input.availabilityDate.trim()}T23:59:59.999Z`,
				);
				if (!Number.isNaN(dayStart.getTime())) {
					const blockingSlots = await ctx.db.availabilitySlot.findMany({
						where: {
							ownerType: "ARTIST",
							type: { in: ["UNAVAILABLE", "BOOKED"] },
							startDate: { lte: dayEnd },
							endDate: { gte: dayStart },
							ownerId: {
								in: normalized.map((a) => a.id as string),
							},
						},
						select: { ownerId: true },
						distinct: ["ownerId"],
					});
					const blockedArtistIds = new Set(
						blockingSlots.map((s) => s.ownerId as string),
					);
					normalized = normalized.filter((a) => !blockedArtistIds.has(a.id));
				}
			}

			return normalized;
		}),

	create: protectedProcedure
		.input(artistSchema)
		.mutation(async ({ ctx, input }) => {
			// Limit number of artists per user
			const artistCount = await ctx.db.artist.count({
				where: { userId: ctx.session.user.id },
			});

			if (artistCount >= 5) {
				throw new Error("Vous avez atteint la limite de 5 artistes.");
			}

			const compat = await getArtistCompat(ctx.db);
			const { genreNames, ...rest } = input;
			const artistData = sanitizeArtistData({ ...rest }, compat);

			// Handle genres: Resolve names to IDs
			const genreIds =
				genreNames && genreNames.length > 0
					? await Promise.all(
							genreNames.map(async (name) => {
								const genre = await ctx.db.genre.upsert({
									where: { name },
									create: { name },
									update: {},
									select: { id: true },
								});
								return genre.id;
							}),
						)
					: [];

			const artist = await ctx.db.artist.create({
				data: {
					userId: ctx.session.user.id,
					...artistData,
					genres: {
						connect: genreIds.map((id) => ({ id })),
					},
				},
				select: buildArtistSelect(compat),
			});

			// Geocode asynchronously after creation
			const geoQuery = [input.city, input.postalCode].filter(Boolean).join(" ");
			if (geoQuery) {
				geocodeAddress(geoQuery).then((coords) => {
					if (coords) {
						ctx.db.artist
							.update({
								where: { id: artist.id },
								data: { latitude: coords.lat, longitude: coords.lng },
							})
							.catch(() => {});
					}
				});
			}

			return normalizeArtist(artist, compat);
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: artistSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const artist = await ctx.db.artist.findUnique({
				where: { id: input.id },
			});

			if (!artist) {
				throw new Error("Artiste non trouvé");
			}

			if (artist.userId !== ctx.session.user.id) {
				throw new Error("Vous n'êtes pas autorisé à modifier cet artiste");
			}

			const compat = await getArtistCompat(ctx.db);
			const { genreNames, ...artistData } = input.data;
			const sanitizedArtistData = sanitizeArtistData({ ...artistData }, compat);

			let genresUpdate = {};
			if (genreNames !== undefined) {
				const genreIds =
					genreNames.length > 0
						? await Promise.all(
								genreNames.map(async (name) => {
									const genre = await ctx.db.genre.upsert({
										where: { name },
										create: { name },
										update: {},
										select: { id: true },
									});
									return genre.id;
								}),
							)
						: [];

				genresUpdate = {
					genres: {
						set: genreIds.map((id) => ({ id })),
					},
				};
			}

			const updatedArtist = await ctx.db.artist.update({
				where: { id: input.id },
				data: {
					...sanitizedArtistData,
					...genresUpdate,
				},
				select: buildArtistSelect(compat),
			});

			// Re-geocode if city/postal code changed
			const geoQuery = [artistData.city, artistData.postalCode]
				.filter(Boolean)
				.join(" ");
			if (geoQuery) {
				geocodeAddress(geoQuery).then((coords) => {
					if (coords) {
						ctx.db.artist
							.update({
								where: { id: input.id },
								data: { latitude: coords.lat, longitude: coords.lng },
							})
							.catch(() => {});
					}
				});
			}

			return normalizeArtist(updatedArtist, compat);
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const artist = await ctx.db.artist.findUnique({
				where: { id: input.id },
			});

			if (!artist) {
				throw new Error("Artiste non trouvé");
			}

			if (artist.userId !== ctx.session.user.id) {
				throw new Error("Vous n'êtes pas autorisé à supprimer cet artiste");
			}

			await ctx.db.artist.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
