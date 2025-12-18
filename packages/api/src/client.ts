import { QueryCache, QueryClient } from "@tanstack/react-query";
import {
	createTRPCClient as createTRPCVanillaClient,
	httpBatchLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "./router";

export interface QueryClientConfig {
	onError?: (error: Error, query: unknown) => void;
}

export function createQueryClient(config?: QueryClientConfig) {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: config?.onError,
		}),
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
				refetchOnWindowFocus: false,
			},
		},
	});
}

export interface TRPCClientConfig {
	url: string;
	headers?: () => Record<string, string> | Promise<Record<string, string>>;
	fetch?: typeof fetch;
}

export function createTRPCClient(config: TRPCClientConfig) {
	const trpcClient = createTRPCVanillaClient<AppRouter>({
		links: [
			httpBatchLink({
				url: config.url,
				headers: config.headers,
				fetch: config.fetch,
			}),
		],
	});

	return trpcClient;
}

export function createTRPCProxy(
	client: ReturnType<typeof createTRPCClient>,
	queryClient: QueryClient,
) {
	return createTRPCOptionsProxy<AppRouter>({
		client,
		queryClient,
	});
}
