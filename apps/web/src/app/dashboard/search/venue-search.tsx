"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

export function VenueSearch() {
	const [search, setSearch] = useState("");
	const normalizedQuery = useMemo(() => search.trim(), [search]);
	const venueSearchQuery = useQuery(
		trpc.venue.search.queryOptions({
			query: normalizedQuery,
		}),
	);
	const venues = venueSearchQuery.data ?? [];
	const hasVenues = venues.length > 0;
	const hasSearchError = venueSearchQuery.isError;
	const isLoading = venueSearchQuery.isLoading;
	const isFetching = venueSearchQuery.isFetching;

	const resultLabel =
		hasSearchError && !hasVenues
			? normalizedQuery
				? `Resultats indisponibles pour "${normalizedQuery}"`
				: "Resultats indisponibles"
			: normalizedQuery
				? `${venues.length} resultat(s) pour "${normalizedQuery}"`
				: `${venues.length} lieu(x) disponible(s)`;

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			<div className="mb-8 space-y-2">
				<h1 className="font-bold text-3xl">Rechercher des lieux</h1>
				<p className="max-w-3xl text-muted-foreground">
					Explorez les lieux et organisateurs deja presents sur Rythmons, puis
					consultez leur profil public pour voir s&apos;ils correspondent a
					votre projet.
				</p>
			</div>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Search className="h-5 w-5" />
						Moteur de recherche
					</CardTitle>
					<CardDescription>
						Recherchez par nom de lieu, ville, code postal, organisateur ou
						genre musical.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="relative">
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Ex. Paris, Rock, Le Chato Do, festival..."
							className="pl-9"
						/>
					</div>
				</CardContent>
			</Card>

			<div className="mb-4 flex flex-col gap-2 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
				<p>{resultLabel}</p>
				{isFetching && !isLoading ? (
					<span className="inline-flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						Mise a jour des resultats...
					</span>
				) : null}
			</div>

			{hasSearchError ? (
				<Card className="mb-6 border-destructive/30" role="alert">
					<CardHeader>
						<CardTitle>Impossible de charger les lieux</CardTitle>
						<CardDescription>
							Votre session a peut-etre expire ou le service est temporairement
							indisponible. Reessayez, puis reconnectez-vous si le probleme
							persiste.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => venueSearchQuery.refetch()}
							disabled={isFetching}
						>
							{isFetching ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Reessai...
								</>
							) : (
								"Reessayer"
							)}
						</Button>
					</CardFooter>
				</Card>
			) : null}

			{isLoading ? (
				<div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed">
					<p className="inline-flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						Chargement des lieux...
					</p>
				</div>
			) : !hasVenues ? (
				hasSearchError ? null : (
					<Card>
						<CardHeader>
							<CardTitle>Aucun lieu trouve pour ces criteres</CardTitle>
							<CardDescription>
								Essayez un autre nom de ville, un genre musical ou le nom
								d&apos;un organisateur.
							</CardDescription>
						</CardHeader>
					</Card>
				)
			) : (
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{venues.map((venue) => (
						<Card key={venue.id} className="h-full">
							<CardHeader className="flex flex-row items-start gap-4 space-y-0">
								<div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
									{venue.logoUrl ? (
										/* biome-ignore lint/performance/noImgElement: venue logos are user-provided remote assets */
										<img
											src={venue.logoUrl}
											alt={venue.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<Building2 className="h-7 w-7 text-muted-foreground" />
									)}
								</div>

								<div className="min-w-0 flex-1">
									<CardTitle className="truncate text-xl">
										{venue.name}
									</CardTitle>
									<CardDescription className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
										<span className="inline-flex items-center gap-1">
											<MapPin className="h-3.5 w-3.5" />
											{venue.city}
										</span>
										<span>{getVenueTypeLabel(venue.venueType)}</span>
									</CardDescription>
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								<p className="inline-flex items-center gap-2 text-muted-foreground text-sm">
									<UserRound className="h-4 w-4" />
									<span>Organisateur : {venue.owner.name}</span>
								</p>

								<div className="flex flex-wrap gap-2">
									{venue.genres.length > 0 ? (
										venue.genres.slice(0, 4).map((genre) => (
											<Badge key={genre.id} variant="secondary">
												{genre.name}
											</Badge>
										))
									) : (
										<span className="text-muted-foreground text-sm">
											Genres non renseignes
										</span>
									)}
								</div>

								<p className="text-muted-foreground text-sm">
									{venue.description ||
										"Aucune description n'a encore ete ajoutee pour ce lieu."}
								</p>
							</CardContent>

							<CardFooter className="mt-auto flex items-center justify-between gap-3">
								<span className="text-muted-foreground text-xs">
									{venue.postalCode}
								</span>
								<Button asChild>
									<Link href={`/venue/${venue.id}`}>Voir profil</Link>
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
