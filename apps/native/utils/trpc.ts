import {
	createQueryClient,
	createTRPCClient,
	createTRPCProxy,
} from "@rythmons/api/client";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { authClient } from "@/lib/auth-client";

export const queryClient = createQueryClient();

const trpcClient = createTRPCClient({
	url: `${getApiBaseUrl()}/trpc`,
	headers() {
		const headers = new Map<string, string>();
		const cookies = authClient.getCookie?.();
		if (cookies) {
			headers.set("Cookie", cookies);
		}
		return Object.fromEntries(headers);
	},
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const trpc = createTRPCProxy(trpcClient, queryClient);
