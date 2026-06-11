import { useCallback, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export function useSignOut() {
	const [isSigningOut, setIsSigningOut] = useState(false);

	const signOut = useCallback(async () => {
		setIsSigningOut(true);
		try {
			await authClient.signOut();
			// clear() et non invalidateQueries() : un refetch sans session échoue
			// mais laisserait les données de l'ancien compte en cache (et sur
			// disque via le persister).
			queryClient.clear();
		} finally {
			setIsSigningOut(false);
		}
	}, []);

	return { isSigningOut, signOut };
}
