"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

const TITLE_TEXT = `
 ██████╗ ██╗   ██╗████████╗██╗  ██╗███╗   ███╗ ██████╗ ███╗   ██╗███████╗
 ██╔══██╗╚██╗ ██╔╝╚══██╔══╝██║  ██║████╗ ████║██╔═══██╗████╗  ██║██╔════╝
 ██████╔╝ ╚████╔╝    ██║   ███████║██╔████╔██║██║   ██║██╔██╗ ██║███████╗
 ██╔══██╗  ╚██╔╝     ██║   ██╔══██║██║╚██╔╝██║██║   ██║██║╚██╗██║╚════██║
 ██║  ██║   ██║      ██║   ██║  ██║██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████║
 ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
`;

export default function Home() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const { data: session } = authClient.useSession();

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
			<div className="mt-6 mb-6 flex flex-wrap gap-3">
				{session?.user ? (
					<Button asChild>
						<Link href="/dashboard">Accéder au tableau de bord</Link>
					</Button>
				) : (
					<Button asChild variant="default">
						<Link href="/login">Se connecter</Link>
					</Button>
				)}
			</div>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">Statut de l’API</h2>
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
						/>
						<span className="text-muted-foreground text-sm">
							{healthCheck.isLoading
								? "Vérification…"
								: healthCheck.data
									? "Connecté"
									: "Déconnecté"}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}
