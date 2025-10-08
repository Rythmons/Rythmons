"use client";
import { useQuery } from "@tanstack/react-query";
import type { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const privateData = useQuery(trpc.privateData.queryOptions());
	const privateMessage = (privateData.data as { message?: string } | undefined)
		?.message;
	const userDisplayName =
		session.user.name ?? session.user.email ?? "Utilisateur";

	return (
		<div className="space-y-2">
			<p>Connecté en tant que {userDisplayName}</p>
			<p>Message de l’API : {privateMessage ?? ""}</p>
		</div>
	);
}
