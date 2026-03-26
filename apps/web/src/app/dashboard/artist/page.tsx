"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

function ArtistPageSkeleton() {
	return (
		<div className="container mx-auto max-w-4xl py-8">
			<div className="mb-8 h-32 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
				<div className="flex items-start gap-4">
					<Skeleton className="h-14 w-14 rounded-xl" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-5 w-96 max-w-full" />
					</div>
				</div>
			</div>
			<div className="rounded-xl border bg-card p-8 shadow-sm">
				<div className="space-y-6">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>
		</div>
	);
}

import { ArtistForm } from "./artist-form";

type ArtistPageItem = {
	id: string;
	stageName: string;
	city?: string | null;
	postalCode?: string | null;
	photoUrl?: string | null;
	bannerUrl?: string | null;
	bio?: string | null;
	website?: string | null;
	socialLinks?: Record<string, string> | null;
	techRequirements?: string | null;
	feeMin?: number | null;
	feeMax?: number | null;
	isNegotiable?: boolean | null;
	genres: { id: string; name: string }[];
	images?: string[] | null;
};

function ArtistPageContent() {
	const searchParams = useSearchParams();
	const editId = searchParams.get("id");
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data: session, isPending: sessionPending } = authClient.useSession();

	// Fetch all artists for this user
	const artistsQuery = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: !!session?.user,
	});
	const artists = artistsQuery.data as ArtistPageItem[] | undefined;
	const { isLoading, error } = artistsQuery;

	if (sessionPending || isLoading) {
		return <ArtistPageSkeleton />;
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
	const artistItems = artists ?? [];

	const artistToEdit = editId
		? artistItems.find((artist) => artist.id === editId)
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
								: "Nouveau profil artiste"}
						</h1>
						<p className="text-lg text-muted-foreground">
							{artistToEdit
								? "Mettez à jour vos informations."
								: "Créez une fiche artiste pour démarcher des lieux."}
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
									city: artistToEdit.city ?? "",
									postalCode: artistToEdit.postalCode ?? "",
									photoUrl: artistToEdit.photoUrl ?? "",
									bannerUrl: artistToEdit.bannerUrl ?? "",
									bio: artistToEdit.bio ?? "",
									website: artistToEdit.website ?? "",
									socialLinks: artistToEdit.socialLinks as Record<
										string,
										string
									> | null,
									techRequirements: artistToEdit.techRequirements ?? "",
									feeMin: artistToEdit.feeMin ?? undefined,
									feeMax: artistToEdit.feeMax ?? undefined,
									isNegotiable: artistToEdit.isNegotiable ?? false,
									genres: artistToEdit.genres,
									images: artistToEdit.images ?? [],
								}
							: undefined
					}
					onSuccess={(artistId) => {
						queryClient.invalidateQueries();
						if (!editId && artistId) {
							router.push(`/artist/${artistId}`);
						} else if (!editId) {
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
		<Suspense fallback={<ArtistPageSkeleton />}>
			<ArtistPageContent />
		</Suspense>
	);
}
