import {
	createQueryClient,
	createTRPCClient,
	createTRPCProxy,
} from "@rythmons/api/client";
import { authClient } from "@/lib/auth-client";

export const queryClient = createQueryClient();

const trpcClient = createTRPCClient({
	url: `${process.env.EXPO_PUBLIC_SERVER_URL}/trpc`,
	headers() {
		const headers = new Map<string, string>();
		const cookies = authClient.getCookie();
		if (cookies) {
			headers.set("Cookie", cookies);
		}
		return Object.fromEntries(headers);
	},
});

export const trpc = createTRPCProxy(trpcClient, queryClient);
