import type { Session } from "@rythmons/auth/types";

export type { Session };

export type Context = {
	session: Session | null | undefined;
};

export interface CreateContextOptions {
	getSession: () => Promise<Session | null | undefined>;
}

export async function createContext(
	options: CreateContextOptions,
): Promise<Context> {
	const session = await options.getSession();
	return {
		session,
	};
}
