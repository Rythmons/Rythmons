import { parseCorsOrigins } from "@rythmons/auth/utils";
import { type NextRequest, NextResponse } from "next/server";

const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN || "");

export function middleware(request: NextRequest) {
	const response = NextResponse.next();
	const requestOrigin = request.headers.get("origin");

	// Only apply CORS for API routes (mobile app)
	// Web routes don't need CORS since they're same-origin
	if (
		request.nextUrl.pathname.startsWith("/api") ||
		request.nextUrl.pathname.startsWith("/trpc")
	) {
		response.headers.set("Access-Control-Allow-Credentials", "true");
		response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
		response.headers.set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		);

		const originToSet =
			requestOrigin && allowedOrigins.includes(requestOrigin)
				? requestOrigin
				: allowedOrigins[0];

		if (originToSet) {
			response.headers.set("Access-Control-Allow-Origin", originToSet);
		}

		if (request.method === "OPTIONS") {
			return new NextResponse(null, {
				status: 204,
				headers: response.headers,
			});
		}
	}

	return response;
}

export const config = {
	matcher: "/:path*",
};
