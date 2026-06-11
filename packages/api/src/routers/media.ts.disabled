import { db } from "@rythmons/db";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Schema création / update
const mediaSchema = z.object({
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	description: z.string().optional().nullable(),
	website: z.string().url().optional().nullable(),
	logoUrl: z.string().url().optional().nullable(),
	country: z.string().default("France"),
	artistIds: z.array(z.string()).optional(), // relation many-to-many
});

export const mediaRouter = router({
	// Récupérer les médias du user connecté
	getMyMedias: protectedProcedure.query(async ({ ctx }) => {
		return db.media.findMany({
			where: {
				ownerId: ctx.session.user.id,
			},
			include: {
				artists: true,
				owner: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}),

	// Récupérer un média par ID (public)
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			return db.media.findUnique({
				where: { id: input.id },
				include: {
					artists: true,
					owner: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});
		}),

	// Créer un média
	create: protectedProcedure
		.input(mediaSchema)
		.mutation(async ({ ctx, input }) => {
			const mediaCount = await db.media.count({
				where: { ownerId: ctx.session.user.id },
			});

			if (mediaCount >= 5) {
				throw new Error("Vous avez atteint la limite de 5 médias.");
			}

			const { artistIds, ...mediaData } = input;

			return db.media.create({
				data: {
					...mediaData,
					ownerId: ctx.session.user.id,
					artists: artistIds
						? {
								connect: artistIds.map((id) => ({ id })),
							}
						: undefined,
				},
				include: {
					artists: true,
				},
			});
		}),

	// Mettre à jour un média
	/////
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: z.object({
					name: z.string(),
					description: z.string().nullable().optional(),
					website: z.string().nullable().optional(),
					country: z.string().nullable().optional(),
					logoUrl: z.string().nullable().optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const media = await db.media.findUnique({
				where: { id: input.id },
			});

			if (!media || media.ownerId !== ctx.session.user.id) {
				throw new Error("Média non trouvé");
			}

			return ctx.db.media.update({
				where: { id: input.id },
				data: input.data,
			});
		}),

	// Supprimer un média
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const media = await db.media.findUnique({
				where: { id: input.id },
			});

			if (!media) {
				throw new Error("Média non trouvé");
			}

			if (media.ownerId !== ctx.session.user.id) {
				throw new Error("Vous n'êtes pas autorisé à supprimer ce média");
			}

			await db.media.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
