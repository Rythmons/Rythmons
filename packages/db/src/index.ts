import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}

export type {
	Account,
	Artist,
	Genre,
	Session,
	User,
	Venue,
	Verification,
} from "@prisma/client";
export { Prisma, UserRole, VenueType } from "@prisma/client";
