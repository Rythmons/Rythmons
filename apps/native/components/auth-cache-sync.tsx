import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

/**
 * Miroir natif de l'AuthCacheSync web : les clés de requêtes tRPC ne sont pas
 * scopées par utilisateur et le cache React Query est persisté sur disque
 * (24 h). On vide donc tout le cache dès que l'identité connectée change,
 * pour ne jamais afficher les données d'un autre compte.
 */
export function AuthCacheSync() {
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
			queryClient.clear();
		}

		previousUserIdRef.current = currentUserId;
	}, [isPending, session?.user?.id]);

	return null;
}
