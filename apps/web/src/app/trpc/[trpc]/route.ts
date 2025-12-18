import { appRouter } from "@rythmons/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { createContext } from "@/lib/trpc-context";

function handler(req: NextRequest) {
	return fetchRequestHandler({
		endpoint: "/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
	});
}
export { handler as GET, handler as POST };
