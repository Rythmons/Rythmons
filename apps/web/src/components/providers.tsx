"use client";

import { AuthProvider } from "@rythmons/auth/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { ExpandedRouteConfig } from "uploadthing/types";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({
	children,
	routerConfig,
}: {
	children: React.ReactNode;
	routerConfig?: React.ComponentProps<typeof NextSSRPlugin>["routerConfig"];
}) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={false}
			forcedTheme="dark"
			disableTransitionOnChange
		>
			{routerConfig && <NextSSRPlugin routerConfig={routerConfig} />}
			<AuthProvider client={authClient}>
				<QueryClientProvider client={queryClient}>
					{children}
					<ReactQueryDevtools />
				</QueryClientProvider>
			</AuthProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
