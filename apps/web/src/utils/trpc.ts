import {
	createQueryClient,
	createTRPCClient,
	createTRPCProxy,
} from "@rythmons/api/client";
import { toast } from "sonner";

export const queryClient = createQueryClient({
	onError: (error: Error) => {
		toast.error(error.message, {
			action: {
				label: "retry",
				onClick: () => {
					queryClient.invalidateQueries();
				},
			},
		});
	},
});

const trpcClient = createTRPCClient({
	url: typeof window !== "undefined" ? "/trpc" : "/trpc",
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const trpc = createTRPCProxy(trpcClient, queryClient);
