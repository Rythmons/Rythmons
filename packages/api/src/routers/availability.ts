import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const listInput = z.object({
	ownerType: z.enum(["ARTIST", "VENUE"]),
	ownerId: z.string(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
});

const upsertSlotInput = z.object({
	ownerType: z.enum(["ARTIST", "VENUE"]),
	ownerId: z.string(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	type: z.enum(["UNAVAILABLE", "OPEN", "BOOKED"]),
});

async function assertCanManageSlot(
	db: {
		artist: {
			findUnique: (args: {
				where: { id: string };
				select: { userId: true };
			}) => Promise<{ userId: string } | null>;
		};
		venue: {
			findUnique: (args: {
				where: { id: string };
				select: { ownerId: true };
			}) => Promise<{ ownerId: string } | null>;
		};
	},
	userId: string,
	ownerType: "ARTIST" | "VENUE",
	ownerId: string,
) {
	if (ownerType === "ARTIST") {
		const artist = await db.artist.findUnique({
			where: { id: ownerId },
			select: { userId: true },
		});
		if (!artist || artist.userId !== userId) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Vous ne pouvez gérer que les disponibilités de vos artistes.",
			});
		}
	} else {
		const venue = await db.venue.findUnique({
			where: { id: ownerId },
			select: { ownerId: true },
		});
		if (!venue || venue.ownerId !== userId) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Vous ne pouvez gérer que les disponibilités de vos lieux.",
			});
		}
	}
}

export const availabilityRouter = router({
	list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
		await assertCanManageSlot(
			ctx.db,
			ctx.session.user.id,
			input.ownerType,
			input.ownerId,
		);

		const slots = await ctx.db.availabilitySlot.findMany({
			where: {
				ownerType: input.ownerType,
				ownerId: input.ownerId,
				OR: [
					{
						startDate: { lte: input.endDate },
						endDate: { gte: input.startDate },
					},
				],
			},
			orderBy: { startDate: "asc" },
			include: {
				booking: {
					select: {
						id: true,
						proposedDate: true,
						status: true,
						artist: { select: { stageName: true } },
						venue: { select: { name: true } },
					},
				},
			},
		});

		return slots;
	}),

	upsert: protectedProcedure
		.input(upsertSlotInput)
		.mutation(async ({ ctx, input }) => {
			if (input.startDate > input.endDate) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La date de fin doit être après la date de début.",
				});
			}

			if (input.type === "BOOKED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Les créneaux BOOKED sont créés automatiquement à l'acceptation d'un booking.",
				});
			}

			await assertCanManageSlot(
				ctx.db,
				ctx.session.user.id,
				input.ownerType,
				input.ownerId,
			);

			await ctx.db.availabilitySlot.deleteMany({
				where: {
					ownerType: input.ownerType,
					ownerId: input.ownerId,
					startDate: { gte: input.startDate },
					endDate: { lte: input.endDate },
					bookingId: null,
				},
			});

			const slot = await ctx.db.availabilitySlot.create({
				data: {
					ownerType: input.ownerType,
					ownerId: input.ownerId,
					startDate: input.startDate,
					endDate: input.endDate,
					type: input.type,
				},
			});

			return slot;
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const slot = await ctx.db.availabilitySlot.findUnique({
				where: { id: input.id },
			});

			if (!slot) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Créneau introuvable.",
				});
			}

			if (slot.bookingId != null) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Impossible de supprimer un créneau lié à un booking confirmé.",
				});
			}

			await assertCanManageSlot(
				ctx.db,
				ctx.session.user.id,
				slot.ownerType,
				slot.ownerId,
			);

			await ctx.db.availabilitySlot.delete({
				where: { id: input.id },
			});

			return { ok: true };
		}),
});
