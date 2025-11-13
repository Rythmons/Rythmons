import type { Context } from "@rythmons/api";
import { auth } from "@rythmons/auth";
import type { NextRequest } from "next/server";

export async function createContext(req: NextRequest): Promise<Context> {
	const session = await auth.api.getSession({
		headers: req.headers,
	});
	return {
		session,
	};
}
