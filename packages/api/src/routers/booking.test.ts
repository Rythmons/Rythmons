import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "../trpc";
import { bookingRouter } from "./booking";

const ARTIST_USER = "user-artist";
const ORGANIZER_USER = "user-organizer";
const OTHER_USER = "user-other";

const PROPOSED_DATE = new Date("2026-07-10T20:00:00.000Z");
const DAY_START = new Date("2026-07-10T00:00:00.000Z");
const DAY_END = new Date("2026-07-10T23:59:59.999Z");

type MockDb = ReturnType<typeof makeDb>;

function makeDb() {
	const tx = {
		$executeRaw: vi.fn().mockResolvedValue(0),
		booking: {
			findFirst: vi.fn().mockResolvedValue(null),
			create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
				id: "booking-new",
				...data,
			})),
			updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		},
		availabilitySlot: {
			// Conflits artiste/lieu et créneau OPEN, routés d'après la clause where.
			findFirst: vi.fn().mockImplementation(async () => null),
			findMany: vi.fn().mockResolvedValue([]),
			deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
			createMany: vi.fn().mockResolvedValue({ count: 2 }),
		},
	};

	const db = {
		artist: {
			findUnique: vi
				.fn()
				.mockResolvedValue({ id: "artist-1", userId: ARTIST_USER }),
		},
		venue: {
			findUnique: vi
				.fn()
				.mockResolvedValue({ id: "venue-1", ownerId: ORGANIZER_USER }),
		},
		booking: {
			findUnique: vi.fn().mockResolvedValue(null),
			updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		},
		$transaction: vi.fn(
			async (fn: (transaction: typeof tx) => Promise<unknown>) => fn(tx),
		),
		tx,
	};

	return db;
}

function makeCaller(db: MockDb, userId: string) {
	const createCaller = t.createCallerFactory(bookingRouter);
	return createCaller({
		session: {
			user: { id: userId },
			// biome-ignore lint/suspicious/noExplicitAny: session minimale de test
		} as any,
		// biome-ignore lint/suspicious/noExplicitAny: faux client Prisma de test
		db: db as any,
	});
}

function pendingBooking(overrides: Record<string, unknown> = {}) {
	return {
		id: "booking-1",
		artistId: "artist-1",
		venueId: "venue-1",
		proposedDate: PROPOSED_DATE,
		status: "PENDING",
		createdByUserId: ARTIST_USER,
		artist: { userId: ARTIST_USER },
		venue: { ownerId: ORGANIZER_USER },
		...overrides,
	};
}

async function expectTRPCError(
	promise: Promise<unknown>,
	code: TRPCError["code"],
) {
	await expect(promise).rejects.toSatisfy(
		(error: unknown) => error instanceof TRPCError && error.code === code,
	);
}

describe("booking.create", () => {
	let db: MockDb;

	beforeEach(() => {
		db = makeDb();
	});

	const input = {
		artistId: "artist-1",
		venueId: "venue-1",
		proposedDate: PROPOSED_DATE,
	};

	it("refuse un utilisateur qui n'est ni l'artiste ni le propriétaire du lieu", async () => {
		await expectTRPCError(
			makeCaller(db, OTHER_USER).create(input),
			"FORBIDDEN",
		);
	});

	it("refuse une proposition entre ses propres profils artiste et lieu", async () => {
		db.venue.findUnique.mockResolvedValue({
			id: "venue-1",
			ownerId: ARTIST_USER,
		});
		await expectTRPCError(
			makeCaller(db, ARTIST_USER).create(input),
			"BAD_REQUEST",
		);
	});

	it("refuse un doublon en attente pour le même jour (vérifié sous verrou)", async () => {
		db.tx.booking.findFirst.mockResolvedValue({ id: "booking-existing" });
		await expectTRPCError(
			makeCaller(db, ARTIST_USER).create(input),
			"CONFLICT",
		);
		expect(db.tx.$executeRaw).toHaveBeenCalledTimes(2);
		expect(db.tx.booking.create).not.toHaveBeenCalled();
	});

	it("crée la proposition en PENDING avec le bon jour UTC vérifié", async () => {
		const booking = await makeCaller(db, ARTIST_USER).create(input);
		expect(booking).toMatchObject({
			status: "PENDING",
			createdByUserId: ARTIST_USER,
		});
		const duplicateWhere = db.tx.booking.findFirst.mock.calls.at(0)?.[0].where;
		expect(duplicateWhere.proposedDate).toEqual({
			gte: DAY_START,
			lte: DAY_END,
		});
	});
});

describe("booking.accept", () => {
	let db: MockDb;

	beforeEach(() => {
		db = makeDb();
		db.booking.findUnique.mockResolvedValue(pendingBooking());
	});

	it("refuse l'acceptation par le créateur de la proposition", async () => {
		await expectTRPCError(
			makeCaller(db, ARTIST_USER).accept({ id: "booking-1" }),
			"FORBIDDEN",
		);
	});

	it("refuse un utilisateur étranger à la proposition", async () => {
		await expectTRPCError(
			makeCaller(db, OTHER_USER).accept({ id: "booking-1" }),
			"FORBIDDEN",
		);
	});

	it("refuse une proposition qui n'est plus en attente", async () => {
		db.booking.findUnique.mockResolvedValue(
			pendingBooking({ status: "REFUSED" }),
		);
		await expectTRPCError(
			makeCaller(db, ORGANIZER_USER).accept({ id: "booking-1" }),
			"BAD_REQUEST",
		);
	});

	it("signale un conflit si l'artiste est indisponible ce jour-là", async () => {
		db.tx.availabilitySlot.findFirst.mockImplementation(
			async ({ where }: { where: { ownerType: string } }) =>
				where.ownerType === "ARTIST" ? { id: "slot-conflict" } : null,
		);
		await expectTRPCError(
			makeCaller(db, ORGANIZER_USER).accept({ id: "booking-1" }),
			"CONFLICT",
		);
	});

	it("exige un créneau OPEN du lieu quand l'artiste a initié la proposition", async () => {
		// Aucune disponibilité OPEN: findFirst renvoie null partout.
		await expectTRPCError(
			makeCaller(db, ORGANIZER_USER).accept({ id: "booking-1" }),
			"CONFLICT",
		);
	});

	it("n'exige pas de créneau OPEN quand le lieu a initié la proposition", async () => {
		db.booking.findUnique.mockResolvedValue(
			pendingBooking({ createdByUserId: ORGANIZER_USER }),
		);
		const result = await makeCaller(db, ARTIST_USER).accept({
			id: "booking-1",
		});
		expect(result).toEqual({ ok: true });
	});

	it("accepte et crée les créneaux BOOKED de l'artiste et du lieu", async () => {
		db.tx.availabilitySlot.findFirst.mockImplementation(
			async ({ where }: { where: { ownerType: string; type?: unknown } }) =>
				where.ownerType === "VENUE" && where.type === "OPEN"
					? { id: "slot-open" }
					: null,
		);
		const result = await makeCaller(db, ORGANIZER_USER).accept({
			id: "booking-1",
		});
		expect(result).toEqual({ ok: true });

		const created =
			db.tx.availabilitySlot.createMany.mock.calls.at(0)?.[0].data;
		expect(created).toEqual([
			expect.objectContaining({
				ownerType: "ARTIST",
				type: "BOOKED",
				bookingId: "booking-1",
				startDate: DAY_START,
				endDate: DAY_END,
			}),
			expect.objectContaining({
				ownerType: "VENUE",
				type: "BOOKED",
				bookingId: "booking-1",
			}),
		]);
	});

	it("signale un conflit si la proposition change d'état entre-temps", async () => {
		db.tx.availabilitySlot.findFirst.mockImplementation(
			async ({ where }: { where: { ownerType: string; type?: unknown } }) =>
				where.ownerType === "VENUE" && where.type === "OPEN"
					? { id: "slot-open" }
					: null,
		);
		db.tx.booking.updateMany.mockResolvedValue({ count: 0 });
		await expectTRPCError(
			makeCaller(db, ORGANIZER_USER).accept({ id: "booking-1" }),
			"CONFLICT",
		);
	});
});

describe("booking.refuse / booking.cancel", () => {
	let db: MockDb;

	beforeEach(() => {
		db = makeDb();
		db.booking.findUnique.mockResolvedValue(pendingBooking());
	});

	it("oriente le créateur vers l'annulation au lieu du refus", async () => {
		await expectTRPCError(
			makeCaller(db, ARTIST_USER).refuse({ id: "booking-1" }),
			"FORBIDDEN",
		);
	});

	it("permet au destinataire de refuser avec un motif normalisé", async () => {
		const result = await makeCaller(db, ORGANIZER_USER).refuse({
			id: "booking-1",
			reason: "  complet ce soir-là  ",
		});
		expect(result).toEqual({ ok: true });
		expect(db.booking.updateMany).toHaveBeenCalledWith({
			where: { id: "booking-1", status: "PENDING" },
			data: { status: "REFUSED", refusalReason: "complet ce soir-là" },
		});
	});

	it("réserve l'annulation à l'expéditeur", async () => {
		await expectTRPCError(
			makeCaller(db, ORGANIZER_USER).cancel({ id: "booking-1" }),
			"FORBIDDEN",
		);
	});

	it("permet à l'expéditeur d'annuler sa proposition en attente", async () => {
		const result = await makeCaller(db, ARTIST_USER).cancel({
			id: "booking-1",
		});
		expect(result).toEqual({ ok: true });
		expect(db.booking.updateMany).toHaveBeenCalledWith({
			where: { id: "booking-1", status: "PENDING" },
			data: { status: "CANCELLED", refusalReason: null },
		});
	});
});
