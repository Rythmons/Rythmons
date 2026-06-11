import type { AvailabilitySlot, Prisma } from "@rythmons/db";

type SlotWriter = Pick<Prisma.TransactionClient, "availabilitySlot">;

/**
 * Retire une plage [rangeStart, rangeEnd] des créneaux donnés en préservant
 * les portions situées avant et après : un créneau OPEN de plusieurs semaines
 * qui chevauche un jour réservé est découpé, pas supprimé.
 */
export async function carveRangeFromSlots(
	tx: SlotWriter,
	slots: AvailabilitySlot[],
	rangeStart: Date,
	rangeEnd: Date,
) {
	if (slots.length === 0) return;

	await tx.availabilitySlot.deleteMany({
		where: { id: { in: slots.map((slot) => slot.id) } },
	});

	const beforeEnd = new Date(rangeStart.getTime() - 1);
	const afterStart = new Date(rangeEnd.getTime() + 1);

	const remainders: Prisma.AvailabilitySlotCreateManyInput[] = [];
	for (const slot of slots) {
		if (slot.startDate < rangeStart) {
			remainders.push({
				ownerType: slot.ownerType,
				ownerId: slot.ownerId,
				startDate: slot.startDate,
				endDate: beforeEnd,
				type: slot.type,
			});
		}
		if (slot.endDate > rangeEnd) {
			remainders.push({
				ownerType: slot.ownerType,
				ownerId: slot.ownerId,
				startDate: afterStart,
				endDate: slot.endDate,
				type: slot.type,
			});
		}
	}

	if (remainders.length > 0) {
		await tx.availabilitySlot.createMany({ data: remainders });
	}
}
