import { cookies, headers } from "next/headers";

/**
 * Get session from server component
 * Uses the local proxy which properly handles cookies on the same domain
 */
export async function getServerSession() {
	const cookieStore = await cookies();
	const allCookies = cookieStore.getAll();

	// Reconstruct cookie header from all cookies
	const cookieHeader = allCookies
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");

	console.log("[getServerSession] Using local proxy /api/auth/get-session");
	console.log(
		"[getServerSession] cookies:",
		cookieHeader ? "present" : "missing",
	);
	console.log("[getServerSession] cookie count:", allCookies.length);

	try {
		const headersList = await headers();
		const protocol = headersList.get("x-forwarded-proto") ?? "http";
		const host = headersList.get("host");
		const originFromHeaders = host ? `${protocol}://${host}` : null;
		const baseURL =
			process.env.NEXT_PUBLIC_SERVER_URL ||
			process.env.BETTER_AUTH_URL ||
			originFromHeaders;

		if (!baseURL) {
			console.error("[getServerSession] Unable to determine baseURL for fetch");
			return { data: null, error: new Error("Missing base URL") };
		}

		const endpoint = new URL("/api/auth/get-session", baseURL);

		// Use local proxy instead of external server so cookies remain first-party
		const response = await fetch(endpoint, {
			method: "GET",
			headers: {
				cookie: cookieHeader,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		console.log("[getServerSession] response status:", response.status);

		if (!response.ok) {
			console.log("[getServerSession] response not ok");
			return { data: null, error: null };
		}

		const sessionData = await response.json();
		console.log(
			"[getServerSession] session found:",
			sessionData ? "yes" : "no",
		);

		// Better Auth returns the session object directly (with user property) or null
		return { data: sessionData, error: null };
	} catch (error) {
		console.error("[getServerSession] Error fetching session:", error);
		return { data: null, error };
	}
}
