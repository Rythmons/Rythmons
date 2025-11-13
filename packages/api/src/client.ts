import { QueryClient } from "@tanstack/react-query";
import { type CreateTRPCReact, createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./router";

export const api: CreateTRPCReact<AppRouter, unknown> =
	createTRPCReact<AppRouter>();

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
				refetchOnWindowFocus: false,
			},
		},
	});
}
