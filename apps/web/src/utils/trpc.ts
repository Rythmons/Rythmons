import type { AppRouter } from "@rythmons/api";
import { createQueryClient } from "@rythmons/api/client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export const queryClient = createQueryClient();

// Add error handling to query cache
queryClient.getQueryCache().config = {
	...queryClient.getQueryCache().config,
	onError: (error) => {
		toast.error(error.message, {
			action: {
				label: "retry",
				onClick: () => {
					queryClient.invalidateQueries();
				},
			},
		});
	},
};

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: typeof window !== "undefined" ? "/trpc" : "/trpc",
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
