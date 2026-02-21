import type { PrismaClient } from "@prisma/client";
import type { Session } from "@rythmons/auth/types";

export type { Session };

export type Context = {
	session: Session | null | undefined;
	db: PrismaClient;
};

export interface CreateContextOptions {
	getSession: () => Promise<Session | null | undefined>;
}

import { db } from "@rythmons/db";

export async function createContext(
	options: CreateContextOptions,
): Promise<Context> {
	const session = await options.getSession();
	return {
		session,
		db,
	};
}
