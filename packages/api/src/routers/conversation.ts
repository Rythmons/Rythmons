import { z } from "zod";
import type { Context } from "../context";
import { protectedProcedure, router } from "../trpc";

/**
 * Helper: récupérer toutes les entités du user
 */
async function getUserEntities(ctx: Context) {
	const user = await ctx.db.user.findUnique({
		where: { id: ctx.session.user.id },
		select: {
			artists: { select: { id: true, stageName: true } },
			venues: { select: { id: true, name: true } },
			Media: { select: { id: true, name: true } },
		},
	});

	if (!user) throw new Error("User not found");

	return [
		...user.artists.map((a) => ({
			entityId: a.id,
			entityType: "ARTIST" as const,
			name: a.stageName,
		})),
		...user.venues.map((v) => ({
			entityId: v.id,
			entityType: "VENUE" as const,
			name: v.name,
		})),
		...user.Media.map((m) => ({
			entityId: m.id,
			entityType: "MEDIA" as const,
			name: m.name,
		})),
	];
}

/**
 * Helper: obtenir le nom d'une entité
 */
async function getEntityName(
	ctx: Context,
	entityId: string,
	entityType: string,
) {
	if (entityType === "ARTIST") {
		const artist = await ctx.db.artist.findUnique({
			where: { id: entityId },
			select: { stageName: true },
		});
		return artist?.stageName || "Artiste inconnu";
	}
	if (entityType === "VENUE") {
		const venue = await ctx.db.venue.findUnique({
			where: { id: entityId },
			select: { name: true },
		});
		return venue?.name || "Lieu inconnu";
	}
	if (entityType === "MEDIA") {
		const media = await ctx.db.media.findUnique({
			where: { id: entityId },
			select: { name: true },
		});
		return media?.name || "Média inconnu";
	}
	return "Entité inconnue";
}

interface Participant {
	entityId: string;
	entityType: string;
}

interface ConversationWithParticipants {
	participants: Participant[];
}

function isParticipant(
	conversation: ConversationWithParticipants,
	myEntities: Participant[],
) {
	return conversation.participants.some((p: Participant) =>
		myEntities.some(
			(me) => me.entityId === p.entityId && me.entityType === p.entityType,
		),
	);
}

export const conversationRouter = router({
	/**
	 * GET /api/conversations/my-entities
	 * → récupérer les entités de l'utilisateur courant
	 */
	getMyEntities: protectedProcedure.query(async ({ ctx }) => {
		const entities = await getUserEntities(ctx);
		return entities;
	}),

	getAll: protectedProcedure.query(async ({ ctx }) => {
		const entities = await getUserEntities(ctx);

		const conversations = await ctx.db.conversation.findMany({
			where: {
				OR: entities.map((e) => ({
					participants: {
						some: {
							entityId: e.entityId,
							entityType: e.entityType,
						},
					},
				})),
			},
			include: {
				participants: true,
				messages: {
					orderBy: { createdAt: "desc" },
					take: 1, // dernier message
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		// Enrichir les conversations avec les noms des participants
		const enrichedConversations = await Promise.all(
			conversations.map(async (conv) => {
				const enrichedParticipants = await Promise.all(
					conv.participants.map(async (p) => ({
						...p,
						name: await getEntityName(ctx, p.entityId, p.entityType),
					})),
				);
				return {
					...conv,
					participants: enrichedParticipants,
				};
			}),
		);

		return enrichedConversations;
	}),

	/**
	 * GET /api/conversations/entity-name/:entityId/:entityType
	 * → obtenir le nom d'une entité
	 */
	getEntityName: protectedProcedure
		.input(
			z.object({
				entityId: z.string(),
				entityType: z.enum(["ARTIST", "VENUE", "MEDIA"]),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await getEntityName(ctx, input.entityId, input.entityType);
		}),

	/**
	 * POST /api/conversations
	 * → créer ou récupérer une conversation
	 */
	getOrCreate: protectedProcedure
		.input(
			z.object({
				targetId: z.string(),
				targetType: z.enum(["ARTIST", "VENUE", "MEDIA"]),
				senderId: z.string(),
				senderType: z.enum(["ARTIST", "VENUE", "MEDIA"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const entities = await getUserEntities(ctx);

			// sécurité : vérifier que sender appartient au user
			const isValidSender = entities.some(
				(e) =>
					e.entityId === input.senderId && e.entityType === input.senderType,
			);

			if (!isValidSender) {
				throw new Error("Unauthorized sender");
			}

			// chercher conversation existante
			const existing = await ctx.db.conversation.findFirst({
				where: {
					AND: [
						{
							participants: {
								some: {
									entityId: input.senderId,
									entityType: input.senderType,
								},
							},
						},
						{
							participants: {
								some: {
									entityId: input.targetId,
									entityType: input.targetType,
								},
							},
						},
					],
				},
			});

			if (existing) return existing;

			// créer
			return ctx.db.conversation.create({
				data: {
					participants: {
						create: [
							{
								entityId: input.senderId,
								entityType: input.senderType,
							},
							{
								entityId: input.targetId,
								entityType: input.targetType,
							},
						],
					},
				},
			});
		}),

	/**
	 * GET /api/conversations/:id/messages
	 */
	getMessages: protectedProcedure
		.input(
			z.object({
				conversationId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const entities = await getUserEntities(ctx);

			const conversation = await ctx.db.conversation.findUnique({
				where: { id: input.conversationId },
				include: {
					participants: true,
				},
			});

			if (!conversation) {
				throw new Error("Conversation not found");
			}

			if (!isParticipant(conversation, entities)) {
				throw new Error("Unauthorized");
			}

			return ctx.db.message.findMany({
				where: {
					conversationId: input.conversationId,
				},
				orderBy: {
					createdAt: "asc",
				},
			});
		}),

	/**
	 * POST /api/messages
	 */
	sendMessage: protectedProcedure
		.input(
			z.object({
				conversationId: z.string(),
				content: z.string().min(1),
				senderId: z.string(),
				senderType: z.enum(["ARTIST", "VENUE", "MEDIA"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const entities = await getUserEntities(ctx);

			const conversation = await ctx.db.conversation.findUnique({
				where: { id: input.conversationId },
				include: { participants: true },
			});

			if (!conversation) {
				throw new Error("Conversation not found");
			}

			// sécurité
			const isAllowed = entities.some(
				(e) =>
					e.entityId === input.senderId && e.entityType === input.senderType,
			);

			if (!isAllowed || !isParticipant(conversation, entities)) {
				throw new Error("Unauthorized");
			}

			const message = await ctx.db.message.create({
				data: {
					content: input.content,
					conversationId: input.conversationId,
					senderId: input.senderId,
					senderType: input.senderType,
				},
			});

			// update updatedAt de la conversation
			await ctx.db.conversation.update({
				where: { id: input.conversationId },
				data: { updatedAt: new Date() },
			});

			return message;
		}),
});
