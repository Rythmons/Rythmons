import { createClient } from "@rythmons/auth-react";

export const authClient = createClient({
	// Use relative URL - same domain in full-stack setup
	baseURL: typeof window !== "undefined" ? window.location.origin : "",
	fetchOptions: {
		credentials: "include",
	},
});
