import { artistSchema } from "@rythmons/validation";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const artistRouter = router({
	myArtists: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.artist.findMany({
			where: { userId: ctx.session.user.id },
			include: {
				genres: true,
				user: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});
	}),

	// Public artist profile
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.artist.findUnique({
				where: { id: input.id },
				include: {
					genres: true,
					user: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});
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

			const { genreNames, ...rest } = input;

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

			return ctx.db.artist.create({
				data: {
					userId: ctx.session.user.id,
					...rest,
					genres: {
						connect: genreIds.map((id) => ({ id })),
					},
				},
				include: {
					genres: true,
					user: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});
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

			const { genreNames, ...artistData } = input.data;

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

			return ctx.db.artist.update({
				where: { id: input.id },
				data: {
					...artistData,
					...genresUpdate,
				},
				include: {
					genres: true,
					user: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});
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
