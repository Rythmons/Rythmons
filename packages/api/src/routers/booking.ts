import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createInput = z.object({
	artistId: z.string(),
	venueId: z.string(),
	proposedDate: z.date(),
	proposedFee: z.number().int().min(0).nullable().optional(),
	initialMessage: z.string().max(2000).optional(),
});

export const bookingRouter = router({
	create: protectedProcedure
		.input(createInput)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [artist, venue] = await Promise.all([
				ctx.db.artist.findUnique({
					where: { id: input.artistId },
					select: { id: true, userId: true },
				}),
				ctx.db.venue.findUnique({
					where: { id: input.venueId },
					select: { id: true, ownerId: true },
				}),
			]);

			if (!artist || !venue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Artiste ou lieu introuvable.",
				});
			}

			const isArtist = artist.userId === userId;
			const isOrganizer = venue.ownerId === userId;

			if (!isArtist && !isOrganizer) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Vous devez être l'artiste ou le propriétaire du lieu pour proposer un booking.",
				});
			}

			const booking = await ctx.db.booking.create({
				data: {
					artistId: input.artistId,
					venueId: input.venueId,
					proposedDate: input.proposedDate,
					proposedFee: input.proposedFee ?? null,
					initialMessage: input.initialMessage ?? null,
					createdByUserId: userId,
					status: "PENDING",
				},
				include: {
					artist: {
						select: {
							id: true,
							stageName: true,
							photoUrl: true,
							user: { select: { id: true, name: true, image: true } },
						},
					},
					venue: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
							city: true,
							owner: { select: { id: true, name: true, image: true } },
						},
					},
					createdBy: {
						select: { id: true, name: true },
					},
				},
			});

			return booking;
		}),

	listMine: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const bookings = await ctx.db.booking.findMany({
			where: {
				OR: [{ artist: { userId } }, { venue: { ownerId: userId } }],
			},
			orderBy: { createdAt: "desc" },
			include: {
				artist: {
					select: {
						id: true,
						stageName: true,
						photoUrl: true,
						user: { select: { id: true, name: true, image: true } },
					},
				},
				venue: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
						city: true,
						owner: { select: { id: true, name: true, image: true } },
					},
				},
				createdBy: {
					select: { id: true, name: true },
				},
			},
		});

		return bookings;
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const booking = await ctx.db.booking.findUnique({
				where: { id: input.id },
				include: {
					artist: {
						select: {
							id: true,
							userId: true,
							stageName: true,
							photoUrl: true,
							bio: true,
							techRequirements: true,
							feeMin: true,
							feeMax: true,
							user: {
								select: { id: true, name: true, image: true, email: true },
							},
							genres: { select: { id: true, name: true } },
						},
					},
					venue: {
						select: {
							id: true,
							ownerId: true,
							name: true,
							logoUrl: true,
							photoUrl: true,
							address: true,
							city: true,
							postalCode: true,
							techInfo: true,
							owner: {
								select: { id: true, name: true, image: true, email: true },
							},
							genres: { select: { id: true, name: true } },
						},
					},
					createdBy: {
						select: { id: true, name: true },
					},
				},
			});

			if (!booking) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Proposition introuvable.",
				});
			}

			const isParticipant =
				booking.artist.userId === userId || booking.venue.ownerId === userId;

			if (!isParticipant) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Vous n'avez pas accès à cette proposition.",
				});
			}

			return booking;
		}),

	accept: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const booking = await ctx.db.booking.findUnique({
				where: { id: input.id },
				include: {
					artist: { select: { userId: true } },
					venue: { select: { ownerId: true } },
				},
			});

			if (!booking) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Proposition introuvable.",
				});
			}

			if (booking.status !== "PENDING") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cette proposition ne peut plus être acceptée.",
				});
			}

			const isArtist = booking.artist.userId === userId;
			const isOrganizer = booking.venue.ownerId === userId;
			const isCreator = booking.createdByUserId === userId;

			if (isCreator) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Seul le destinataire peut accepter la proposition.",
				});
			}

			if (!isArtist && !isOrganizer) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Vous n'avez pas accès à cette proposition.",
				});
			}

			const startOfDay = new Date(booking.proposedDate);
			startOfDay.setUTCHours(0, 0, 0, 0);
			const endOfDay = new Date(booking.proposedDate);
			endOfDay.setUTCHours(23, 59, 59, 999);

			await ctx.db.$transaction([
				ctx.db.booking.update({
					where: { id: input.id },
					data: { status: "ACCEPTED" },
				}),
				ctx.db.availabilitySlot.create({
					data: {
						ownerType: "ARTIST",
						ownerId: booking.artistId,
						startDate: startOfDay,
						endDate: endOfDay,
						type: "BOOKED",
						bookingId: booking.id,
					},
				}),
				ctx.db.availabilitySlot.create({
					data: {
						ownerType: "VENUE",
						ownerId: booking.venueId,
						startDate: startOfDay,
						endDate: endOfDay,
						type: "BOOKED",
						bookingId: booking.id,
					},
				}),
			]);

			return { ok: true };
		}),

	refuse: protectedProcedure
		.input(z.object({ id: z.string(), reason: z.string().max(500).optional() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const booking = await ctx.db.booking.findUnique({
				where: { id: input.id },
				include: {
					artist: { select: { userId: true } },
					venue: { select: { ownerId: true } },
				},
			});

			if (!booking) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Proposition introuvable.",
				});
			}

			if (booking.status !== "PENDING") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cette proposition ne peut plus être refusée.",
				});
			}

			const isArtist = booking.artist.userId === userId;
			const isOrganizer = booking.venue.ownerId === userId;

			if (!isArtist && !isOrganizer) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Vous n'avez pas accès à cette proposition.",
				});
			}

			if (booking.createdByUserId === userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Utilisez Annuler pour retirer votre proposition.",
				});
			}

			await ctx.db.booking.update({
				where: { id: input.id },
				data: { status: "REFUSED" },
			});

			return { ok: true };
		}),

	cancel: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const booking = await ctx.db.booking.findUnique({
				where: { id: input.id },
			});

			if (!booking) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Proposition introuvable.",
				});
			}

			if (booking.status !== "PENDING") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Seules les propositions en attente peuvent être annulées.",
				});
			}

			if (booking.createdByUserId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Seul l'expéditeur peut annuler la proposition.",
				});
			}

			await ctx.db.booking.update({
				where: { id: input.id },
				data: { status: "CANCELLED" },
			});

			return { ok: true };
		}),
});
