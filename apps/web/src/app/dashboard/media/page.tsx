"use client";

import { Loader2, Mic2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function MediaPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { isPending: sessionPending } = authClient.useSession();
	const editId = searchParams.get("id");

	if (sessionPending) {
		return (
			<div className="container mx-auto max-w-4xl py-8">
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2 text-muted-foreground">Chargement...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-4xl py-8">
			{/* Welcome Header */}
			<div className="mb-8 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
				<div className="flex items-start gap-4">
					<div className="rounded-xl bg-primary/20 p-3">
						<Mic2 className="h-8 w-8 text-primary" />
					</div>
					<div>
						<h1 className="mb-2 font-bold text-3xl">
							Projets médias (bientôt)
						</h1>
						<p className="text-lg text-muted-foreground">
							Cette section fait partie d&apos;Epic 4 et n&apos;est pas encore
							disponible.
						</p>
					</div>
				</div>
			</div>

			<div className="rounded-xl border bg-card p-8 shadow-sm">
				<p className="text-muted-foreground">
					{editId
						? "L’édition média n’est pas encore disponible."
						: "La création de médias / radios sera disponible dans Epic 4."}
				</p>
				<div className="mt-6 flex flex-wrap gap-3">
					<Button onClick={() => router.push("/dashboard")}>
						Retour au tableau de bord
					</Button>
					<Button
						variant="outline"
						onClick={() => router.push("/dashboard/bookings")}
					>
						Aller aux bookings
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function MediaPage() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto max-w-4xl py-8">
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<span className="ml-2 text-muted-foreground">Chargement...</span>
					</div>
				</div>
			}
		>
			<MediaPageContent />
		</Suspense>
	);
}
