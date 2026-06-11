import {
	createQueryClient,
	createTRPCClient,
	createTRPCProxy,
} from "@rythmons/api/client";
import { toast } from "sonner";

/**
 * Creates a new QueryClient with the app's default error handler.
 * Call this inside a component (via useState/useRef) to avoid sharing
 * cache state between concurrent SSR requests.
 */
export function createAppQueryClient() {
	// `client` is captured by the onError closure after assignment.
	// eslint-disable-next-line prefer-const
	let client: ReturnType<typeof createQueryClient>;
	client = createQueryClient({
		onError: (error: Error) => {
			const isNetworkError =
				error.message === "Failed to fetch" ||
				error.message === "Network request failed" ||
				(error as Error & { code?: string }).code === "ECONNABORTED";
			const message = isNetworkError
				? "Pas de connexion. Réessayez quand le réseau est disponible."
				: error.message;
			toast.error(message, {
				action: {
					label: "Réessayer",
					onClick: () => {
						client.invalidateQueries();
					},
				},
			});
		},
	});
	return client;
}

const trpcClient = createTRPCClient({
	url:
		typeof window !== "undefined"
			? "/trpc"
			: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/trpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

// A private QueryClient instance used only by the tRPC options proxy for
// query-key generation. It is intentionally not exported or shared with
// <QueryClientProvider>; all cache operations in components must go through
// the QueryClient obtained from useQueryClient().
const _proxyQueryClient = createQueryClient();

export const trpc = createTRPCProxy(trpcClient, _proxyQueryClient);
