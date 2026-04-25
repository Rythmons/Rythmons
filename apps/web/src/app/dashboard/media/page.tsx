"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mic2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { MediaForm } from "./media-form";

function MediaPageContent() {
	const searchParams = useSearchParams();
	const editId = searchParams.get("id");
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data: session, isPending: sessionPending } = authClient.useSession();

	// Fetch all medias for this user
	const {
		data: medias,
		isLoading,
		error,
	} = useQuery({
		...trpc.media.getMyMedias.queryOptions(),
		enabled: !!session?.user,
	});

	if (sessionPending || isLoading) {
		return (
			<div className="container mx-auto max-w-4xl py-8">
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2 text-muted-foreground">Chargement...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto max-w-4xl py-8">
				<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
					<p className="text-destructive">Erreur: {error.message}</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => window.location.reload()}
					>
						Réessayer
					</Button>
				</div>
			</div>
		);
	}

	// Logic:
	// 1. If editId is provided, find that media to edit.
	// 2. If no editId, we show "Create New" form.
	// (The Dashboard handles the list view now).

	const mediaToEdit = editId
		? (medias ?? []).find((a: { id: string }) => a.id === editId)
		: undefined;

	// If ID provided but not found?
	if (editId && !mediaToEdit) {
		return (
			<div className="container mx-auto max-w-4xl py-8">
				<p>Media introuvable.</p>
				<Button onClick={() => router.push("/dashboard")}>
					Retour au tableau de bord
				</Button>
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
							{mediaToEdit
								? `Modifier ${mediaToEdit.name}`
								: "Nouveau projet médiatique"}
						</h1>
						<p className="text-lg text-muted-foreground">
							{mediaToEdit
								? "Mettez à jour vos informations."
								: "Créez une fiche pour votre groupe ou projet solo pour démarcher des lieux."}
						</p>
					</div>
				</div>
			</div>

			{/* Form */}
			<div className="rounded-xl border bg-card p-8 shadow-sm">
				<MediaForm
					mode={mediaToEdit ? "edit" : "create"}
					initialData={
						mediaToEdit
							? {
									id: mediaToEdit.id,
									name: mediaToEdit.name,
									description: mediaToEdit.description ?? "",
									website: mediaToEdit.website ?? "",
									logoUrl: mediaToEdit.logoUrl ?? "",
									country: mediaToEdit.country ?? "France",
									artists: mediaToEdit.artists ?? [],
								}
							: undefined
					}
					onSuccess={() => {
						queryClient.invalidateQueries();
						if (!editId) {
							// If created, go back to dashboard to see it in list?
							// Or stay here?
							router.push("/dashboard");
						}
					}}
				/>
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
