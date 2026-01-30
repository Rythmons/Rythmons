"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Mic2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";
import { ArtistForm } from "./artist-form";

function ArtistPageContent() {
	const searchParams = useSearchParams();
	const editId = searchParams.get("id");
	const router = useRouter();

	const { data: session, isPending: sessionPending } = authClient.useSession();

	// Fetch all artists for this user
	const {
		data: artists,
		isLoading,
		error,
	} = useQuery({
		...trpc.artist.myArtists.queryOptions(),
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
	// 1. If editId is provided, find that artist to edit.
	// 2. If no editId, we show "Create New" form.
	// (The Dashboard handles the list view now).

	const artistToEdit = editId
		? (artists as any[])?.find((a) => a.id === editId)
		: undefined;

	// If ID provided but not found?
	if (editId && !artistToEdit) {
		return (
			<div className="container mx-auto max-w-4xl py-8">
				<p>Artiste introuvable.</p>
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
							{artistToEdit
								? `Modifier ${artistToEdit.stageName}`
								: "Nouveau projet artistique"}
						</h1>
						<p className="text-lg text-muted-foreground">
							{artistToEdit
								? "Mettez à jour vos informations."
								: "Créez une fiche pour votre groupe ou projet solo pour démarcher des lieux."}
						</p>
					</div>
				</div>
			</div>

			{/* Form */}
			<div className="rounded-xl border bg-card p-8 shadow-sm">
				<ArtistForm
					mode={artistToEdit ? "edit" : "create"}
					initialData={
						artistToEdit
							? {
									id: artistToEdit.id,
									stageName: artistToEdit.stageName,
									bio: artistToEdit.bio ?? "",
									website: artistToEdit.website ?? "",
									techRequirements: artistToEdit.techRequirements ?? "",
									feeMin: artistToEdit.feeMin ?? undefined,
									feeMax: artistToEdit.feeMax ?? undefined,
									genres: artistToEdit.genres,
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

export default function ArtistPage() {
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
			<ArtistPageContent />
		</Suspense>
	);
}
