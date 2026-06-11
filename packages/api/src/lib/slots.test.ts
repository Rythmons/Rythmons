import type { AvailabilitySlot, Prisma } from "@rythmons/db";
import { describe, expect, it, type Mock, vi } from "vitest";
import { carveRangeFromSlots } from "./slots";

type SlotWriter = Pick<Prisma.TransactionClient, "availabilitySlot">;

type MockTx = {
	availabilitySlot: {
		deleteMany: Mock;
		createMany: Mock;
	};
};

function slot(
	partial: Partial<AvailabilitySlot> & Pick<AvailabilitySlot, "id">,
): AvailabilitySlot {
	return {
		ownerType: "VENUE",
		ownerId: "venue-1",
		startDate: new Date("2026-07-01T00:00:00.000Z"),
		endDate: new Date("2026-07-31T23:59:59.999Z"),
		type: "OPEN",
		bookingId: null,
		createdAt: new Date("2026-07-01T00:00:00.000Z"),
		updatedAt: new Date("2026-07-01T00:00:00.000Z"),
		...partial,
	};
}

function makeTx(): MockTx {
	return {
		availabilitySlot: {
			deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
			createMany: vi.fn().mockResolvedValue({ count: 0 }),
		},
	};
}

function asSlotWriter(tx: MockTx): SlotWriter {
	return tx as unknown as SlotWriter;
}

const DAY_START = new Date("2026-07-10T00:00:00.000Z");
const DAY_END = new Date("2026-07-10T23:59:59.999Z");

describe("carveRangeFromSlots", () => {
	it("ne fait rien sans créneau chevauchant", async () => {
		const tx = makeTx();
		await carveRangeFromSlots(asSlotWriter(tx), [], DAY_START, DAY_END);
		expect(tx.availabilitySlot.deleteMany).not.toHaveBeenCalled();
		expect(tx.availabilitySlot.createMany).not.toHaveBeenCalled();
	});

	it("découpe un créneau multi-jours en deux restes autour du jour retiré", async () => {
		const tx = makeTx();
		const monthSlot = slot({ id: "s1" });
		await carveRangeFromSlots(
			asSlotWriter(tx),
			[monthSlot],
			DAY_START,
			DAY_END,
		);

		expect(tx.availabilitySlot.deleteMany).toHaveBeenCalledWith({
			where: { id: { in: ["s1"] } },
		});
		const created = tx.availabilitySlot.createMany.mock.calls.at(0)?.[0].data;
		expect(created).toHaveLength(2);
		expect(created[0]).toMatchObject({
			type: "OPEN",
			startDate: monthSlot.startDate,
			endDate: new Date("2026-07-09T23:59:59.999Z"),
		});
		expect(created[1]).toMatchObject({
			type: "OPEN",
			startDate: new Date("2026-07-11T00:00:00.000Z"),
			endDate: monthSlot.endDate,
		});
	});

	it("supprime sans reste un créneau couvrant exactement la plage", async () => {
		const tx = makeTx();
		const daySlot = slot({ id: "s2", startDate: DAY_START, endDate: DAY_END });
		await carveRangeFromSlots(asSlotWriter(tx), [daySlot], DAY_START, DAY_END);

		expect(tx.availabilitySlot.deleteMany).toHaveBeenCalled();
		expect(tx.availabilitySlot.createMany).not.toHaveBeenCalled();
	});

	it("conserve seulement la portion antérieure pour un chevauchement de fin", async () => {
		const tx = makeTx();
		const head = slot({
			id: "s3",
			startDate: new Date("2026-07-08T00:00:00.000Z"),
			endDate: DAY_END,
		});
		await carveRangeFromSlots(asSlotWriter(tx), [head], DAY_START, DAY_END);

		const created = tx.availabilitySlot.createMany.mock.calls.at(0)?.[0].data;
		expect(created).toHaveLength(1);
		expect(created[0]).toMatchObject({
			startDate: head.startDate,
			endDate: new Date("2026-07-09T23:59:59.999Z"),
		});
	});
});
