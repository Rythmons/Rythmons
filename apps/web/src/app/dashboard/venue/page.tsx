"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

function VenuePageSkeleton() {
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

import { VenueForm } from "./venue-form";

function VenuePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const editId = searchParams.get("id");
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const queryClient = useQueryClient();
	const {
		data: venues,
		isLoading,
		error,
	} = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: !!session?.user,
	});

	// If user wants to edit a specific venue, redirect to the profile page
	useEffect(() => {
		if (editId && !isLoading) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			router.replace(
				`/venue/${editId}` as Parameters<typeof router.replace>[0],
			);
		}
	}, [editId, isLoading, router]);

	// If user has venues and is not explicitly creating a new one, redirect to first venue
	const isNewMode = searchParams.get("new") === "true";
	useEffect(() => {
		if (!isNewMode && !isLoading && venues && venues.length > 0) {
			const first = venues[0];
			if (first && "id" in first) {
				router.replace(`/venue/${first.id}`);
			}
		}
	}, [isNewMode, isLoading, venues, router]);

	if (sessionPending || isLoading || editId) {
		return <VenuePageSkeleton />;
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

	// Create New Mode (shown when no venues exist or explicitly creating new)
	return (
		<div className="container mx-auto max-w-4xl py-8">
			{/* Welcome Header */}
			<div className="mb-8 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
				<div className="flex items-start gap-4">
					<div className="rounded-xl bg-primary/20 p-3">
						<Building2 className="h-8 w-8 text-primary" />
					</div>
					<div>
						<h1 className="mb-2 font-bold text-3xl">
							{venues && venues.length > 0
								? "Ajouter un nouveau lieu"
								: "Créer le profil de votre lieu"}
						</h1>
						<p className="text-lg text-muted-foreground">
							{venues && venues.length > 0
								? "Ajoutez un nouveau lieu à votre portfolio."
								: "Bienvenue ! Pour commencer à recevoir des propositions d'artistes, créez d'abord le profil de votre établissement."}
						</p>
					</div>
				</div>
			</div>

			{/* Create Form */}
			<div className="rounded-xl border bg-card p-8 shadow-sm">
				<VenueForm
					mode="create"
					onSuccess={(venueId?: string) => {
						queryClient.invalidateQueries();
						if (venueId) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							router.push(
								`/venue/${venueId}` as Parameters<typeof router.push>[0],
							);
						} else {
							router.push("/dashboard");
						}
					}}
				/>
			</div>
		</div>
	);
}

export default function VenuePage() {
	return (
		<Suspense fallback={<VenuePageSkeleton />}>
			<VenuePageContent />
		</Suspense>
	);
}
