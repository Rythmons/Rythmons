import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	// Use relative URL - same domain in full-stack setup
	baseURL: typeof window !== "undefined" ? window.location.origin : "",
	fetchOptions: {
		credentials: "include",
	},
});
