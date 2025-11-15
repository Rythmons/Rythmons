import type { Context } from "@rythmons/api";
import { createContext as createApiContext } from "@rythmons/api";
import { auth } from "@rythmons/auth";
import type { NextRequest } from "next/server";

export async function createContext(req: NextRequest): Promise<Context> {
	return createApiContext({
		getSession: async () => {
			return auth.api.getSession({
				headers: req.headers,
			});
		},
	});
}
