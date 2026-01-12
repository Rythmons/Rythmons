"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";
import { VenueForm } from "./venue-form";

export default function VenuePage() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const {
		data: venue,
		isLoading,
		error,
	} = useQuery({
		...trpc.venue.getMyVenue.queryOptions(),
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

	// No venue yet - show creation wizard
	if (!venue) {
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
								Créer le profil de votre lieu
							</h1>
							<p className="text-lg text-muted-foreground">
								Bienvenue ! Pour commencer à recevoir des propositions
								d'artistes, créez d'abord le profil de votre établissement.
							</p>
						</div>
					</div>
				</div>

				{/* Create Form */}
				<div className="rounded-xl border bg-card p-8 shadow-sm">
					<VenueForm
						mode="create"
						onSuccess={() => queryClient.invalidateQueries()}
					/>
				</div>
			</div>
		);
	}

	// Venue exists - show edit form
	return (
		<div className="container mx-auto max-w-4xl py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Mon Lieu</h1>
					<p className="text-muted-foreground">
						Gérez les informations de votre établissement
					</p>
				</div>
			</div>

			{/* Venue Preview Card */}
			<div className="mb-8 overflow-hidden rounded-xl border bg-card shadow-sm">
				<div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
					{venue.photoUrl && (
						<Image
							src={venue.photoUrl}
							alt={venue.name}
							fill
							className="object-cover"
							unoptimized
						/>
					)}
					{venue.logoUrl && (
						<div className="absolute bottom-4 left-4 rounded-xl bg-white p-2 shadow-lg">
							<Image
								src={venue.logoUrl}
								alt="Logo"
								width={64}
								height={64}
								className="object-contain" // h-16 w-16 is 64px
								unoptimized
							/>
						</div>
					)}
				</div>
				<div className="p-6">
					<div className="flex items-center gap-3">
						<h2 className="font-bold text-2xl">{venue.name}</h2>
						<span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm">
							{venue.venueType.replace(/_/g, " ")}
						</span>
					</div>
					<p className="mt-2 text-muted-foreground">
						{venue.address}, {venue.postalCode} {venue.city}
					</p>
					{venue.capacity && (
						<p className="mt-1 text-muted-foreground text-sm">
							Capacité: {venue.capacity} personnes
						</p>
					)}
				</div>
			</div>

			{/* Edit Form */}
			<div className="rounded-xl border bg-card p-8 shadow-sm">
				<h2 className="mb-6 font-semibold text-xl">
					Modifier les informations
				</h2>
				<VenueForm
					mode="edit"
					initialData={{
						id: venue.id,
						name: venue.name,
						address: venue.address,
						city: venue.city,
						postalCode: venue.postalCode,
						country: venue.country,
						venueType: venue.venueType,
						capacity: venue.capacity,
						description: venue.description ?? "",
						photoUrl: venue.photoUrl ?? "",
						logoUrl: venue.logoUrl ?? "",
						genres: venue.genres,
					}}
					onSuccess={() => queryClient.invalidateQueries()}
				/>
			</div>
		</div>
	);
}
