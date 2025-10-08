import { useCallback, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export function useSignOut() {
	const [isSigningOut, setIsSigningOut] = useState(false);

	const signOut = useCallback(async () => {
		setIsSigningOut(true);
		try {
			await authClient.signOut();
			await queryClient.invalidateQueries();
		} finally {
			setIsSigningOut(false);
		}
	}, []);

	return { isSigningOut, signOut };
}
