import {
	bookingByIdSchema,
	bookingCreateSchema,
	bookingListFilterSchema,
	bookingRefuseSchema,
} from "@rythmons/validation";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";

function getBookingDayRange(date: Date) {
	const startOfDay = new Date(date);
	startOfDay.setUTCHours(0, 0, 0, 0);
	const endOfDay = new Date(date);
	endOfDay.setUTCHours(23, 59, 59, 999);
	return { startOfDay, endOfDay };
}

function normalizeOptionalReason(reason?: string) {
	const trimmed = reason?.trim();
	return trimmed ? trimmed : null;
}

export const bookingRouter = router({
	create: protectedProcedure
		.input(bookingCreateSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { startOfDay, endOfDay } = getBookingDayRange(input.proposedDate);

			const [artist, venue, existingPendingBooking] = await Promise.all([
				ctx.db.artist.findUnique({
					where: { id: input.artistId },
					select: { id: true, userId: true },
				}),
				ctx.db.venue.findUnique({
					where: { id: input.venueId },
					select: { id: true, ownerId: true },
				}),
				ctx.db.booking.findFirst({
					where: {
						artistId: input.artistId,
						venueId: input.venueId,
						status: "PENDING",
						proposedDate: {
							gte: startOfDay,
							lte: endOfDay,
						},
					},
					select: { id: true },
				}),
			]);

			if (!artist || !venue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Artiste ou lieu introuvable.",
				});
			}

			if (artist.userId === venue.ownerId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Vous ne pouvez pas créer une proposition entre vos propres profils artiste et lieu.",
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

			if (existingPendingBooking) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Une proposition en attente existe déjà entre cet artiste et ce lieu pour cette date.",
				});
			}

			const booking = await ctx.db.booking.create({
				data: {
					artistId: input.artistId,
					venueId: input.venueId,
					proposedDate: input.proposedDate,
					proposedFee: input.proposedFee ?? null,
					initialMessage: input.initialMessage?.trim() || null,
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

	listMine: protectedProcedure
		.input(bookingListFilterSchema.optional())
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const bookings = await ctx.db.booking.findMany({
				where: {
					OR: [{ artist: { userId } }, { venue: { ownerId: userId } }],
					...(input?.status ? { status: input.status } : {}),
				},
				orderBy: { updatedAt: "desc" },
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
		.input(bookingByIdSchema)
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
		.input(bookingByIdSchema)
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

			const { startOfDay, endOfDay } = getBookingDayRange(booking.proposedDate);
			const dayLockKey = startOfDay.toISOString().slice(0, 10);
			// Si le propriétaire du lieu a initié la proposition, la date est
			// implicitement ouverte : l'artiste qui accepte ne peut pas gérer le
			// calendrier du lieu, on ne lui impose donc pas un créneau OPEN.
			const requiresVenueOpenSlot =
				booking.createdByUserId !== booking.venue.ownerId;

			await ctx.db.$transaction(async (tx) => {
				await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:artist:${booking.artistId}:${dayLockKey}`}))`;
				await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:venue:${booking.venueId}:${dayLockKey}`}))`;

				const [artistConflict, venueConflict, venueOpenSlot] =
					await Promise.all([
						tx.availabilitySlot.findFirst({
							where: {
								ownerType: "ARTIST",
								ownerId: booking.artistId,
								type: { in: ["UNAVAILABLE", "BOOKED"] },
								startDate: { lte: endOfDay },
								endDate: { gte: startOfDay },
							},
							select: { id: true },
						}),
						tx.availabilitySlot.findFirst({
							where: {
								ownerType: "VENUE",
								ownerId: booking.venueId,
								type: "BOOKED",
								startDate: { lte: endOfDay },
								endDate: { gte: startOfDay },
							},
							select: { id: true },
						}),
						tx.availabilitySlot.findFirst({
							where: {
								ownerType: "VENUE",
								ownerId: booking.venueId,
								type: "OPEN",
								startDate: { lte: endOfDay },
								endDate: { gte: startOfDay },
							},
							select: { id: true },
						}),
					]);

				if (artistConflict) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"L'artiste n'est pas disponible sur cette date. Mettez à jour le calendrier avant d'accepter.",
					});
				}

				if (requiresVenueOpenSlot && !venueOpenSlot) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"Le lieu n'est pas ouvert sur cette date. Ajoutez d'abord une disponibilité dans le calendrier.",
					});
				}

				if (venueConflict) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Le lieu possède déjà un booking confirmé sur cette date.",
					});
				}

				const updated = await tx.booking.updateMany({
					where: { id: input.id, status: "PENDING" },
					data: { status: "ACCEPTED", refusalReason: null },
				});

				if (updated.count !== 1) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"Cette proposition a changé d'état entre-temps. Rechargez la page avant de réessayer.",
					});
				}

				await Promise.all([
					tx.availabilitySlot.deleteMany({
						where: {
							ownerType: "ARTIST",
							ownerId: booking.artistId,
							bookingId: null,
							startDate: { lte: endOfDay },
							endDate: { gte: startOfDay },
						},
					}),
					tx.availabilitySlot.deleteMany({
						where: {
							ownerType: "VENUE",
							ownerId: booking.venueId,
							bookingId: null,
							startDate: { lte: endOfDay },
							endDate: { gte: startOfDay },
						},
					}),
				]);

				await tx.availabilitySlot.createMany({
					data: [
						{
							ownerType: "ARTIST",
							ownerId: booking.artistId,
							startDate: startOfDay,
							endDate: endOfDay,
							type: "BOOKED",
							bookingId: booking.id,
						},
						{
							ownerType: "VENUE",
							ownerId: booking.venueId,
							startDate: startOfDay,
							endDate: endOfDay,
							type: "BOOKED",
							bookingId: booking.id,
						},
					],
				});
			});

			return { ok: true };
		}),

	refuse: protectedProcedure
		.input(bookingRefuseSchema)
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

			const updated = await ctx.db.booking.updateMany({
				where: { id: input.id, status: "PENDING" },
				data: {
					status: "REFUSED",
					refusalReason: normalizeOptionalReason(input.reason),
				},
			});

			if (updated.count !== 1) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Cette proposition a changé d'état entre-temps. Rechargez la page avant de réessayer.",
				});
			}

			return { ok: true };
		}),

	cancel: protectedProcedure
		.input(bookingByIdSchema)
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

			const updated = await ctx.db.booking.updateMany({
				where: { id: input.id, status: "PENDING" },
				data: { status: "CANCELLED", refusalReason: null },
			});

			if (updated.count !== 1) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Cette proposition a changé d'état entre-temps. Rechargez la page avant de réessayer.",
				});
			}

			return { ok: true };
		}),
});
