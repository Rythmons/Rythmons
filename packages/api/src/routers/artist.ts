import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const artistRouter = router({
	myArtists: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.artist.findMany({
			where: { userId: ctx.session.user.id },
			include: { genres: true },
		});
	}),

	create: protectedProcedure
		.input(
			z.object({
				stageName: z.string().min(1, "Nom de scène requis"),
				bio: z.string().optional(),
				genres: z.array(z.string()),
				website: z.string().url().optional().or(z.literal("")),
				socialLinks: z.any().optional(),
				techRequirements: z.string().optional(),
				feeMin: z.number().int().nonnegative().optional(),
				feeMax: z.number().int().nonnegative().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Limit number of artists per user
			const artistCount = await ctx.db.artist.count({
				where: { userId: ctx.session.user.id },
			});

			if (artistCount >= 5) {
				throw new Error("Vous avez atteint la limite de 5 artistes.");
			}

			const { genres, ...rest } = input;

			// Handle genres: Resolve names to IDs
			const genreIds = await Promise.all(
				genres.map(async (name) => {
					const genre = await ctx.db.genre.upsert({
						where: { name },
						create: { name },
						update: {},
						select: { id: true },
					});
					return genre.id;
				}),
			);

			return ctx.db.artist.create({
				data: {
					userId: ctx.session.user.id,
					...rest,
					genres: {
						connect: genreIds.map((id) => ({ id })),
					},
				},
				include: { genres: true },
			});
		}),
});
