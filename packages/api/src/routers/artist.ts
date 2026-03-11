import type { Prisma } from "@rythmons/db";
import { artistSchema } from "@rythmons/validation";
import { z } from "zod";
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
