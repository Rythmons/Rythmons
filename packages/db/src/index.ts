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
	Conversation,
	ConversationParticipant,
	Genre,
	Media,
	Message,
	Session,
	User,
	Venue,
	Verification,
} from "@prisma/client";
export { EntityType, Prisma, UserRole, VenueType } from "@prisma/client";
