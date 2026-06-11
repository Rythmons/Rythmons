import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Neon serverless driver: passe par HTTPS/WSS (port 443) au lieu du
// protocole Postgres sur 5432, souvent bloqué par certains réseaux.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const adapter = new PrismaNeon({
	connectionString: process.env.DATABASE_URL,
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}

export type {
	Account,
	Artist,
	AvailabilitySlot,
	Booking,
	Genre,
	Session,
	User,
	Venue,
	Verification,
} from "@prisma/client";
export {
	AvailabilityOwnerType,
	BookingStatus,
	Prisma,
	SlotType,
	UserRole,
	VenueType,
} from "@prisma/client";
