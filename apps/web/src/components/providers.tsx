"use client";

import { AuthProvider } from "@rythmons/auth/client";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { queryClient as appQueryClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

function AuthCacheSync() {
	const router = useRouter();
	const reactQueryClient = useQueryClient();
	const { data: session, isPending } = authClient.useSession();
	const previousUserIdRef = useRef<string | null | undefined>(undefined);

	useEffect(() => {
		if (isPending) {
			return;
		}

		const currentUserId = session?.user?.id ?? null;
		const previousUserId = previousUserIdRef.current;

		if (previousUserId === undefined) {
			previousUserIdRef.current = currentUserId;
			return;
		}

		if (previousUserId !== currentUserId) {
			// User-scoped tRPC queries reuse stable keys, so clear them when the
			// authenticated identity changes to avoid showing another account's data.
			reactQueryClient.clear();
			router.refresh();
		}

		previousUserIdRef.current = currentUserId;
	}, [isPending, reactQueryClient, router, session?.user?.id]);

	return null;
}

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
				<QueryClientProvider client={appQueryClient}>
					<AuthCacheSync />
					{children}
					<ReactQueryDevtools />
				</QueryClientProvider>
			</AuthProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
