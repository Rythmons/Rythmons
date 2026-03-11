"use client";

import { MUSIC_GENRES, venueTypeValues } from "@rythmons/validation";
import { useQuery } from "@tanstack/react-query";
import {
	Building2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Loader2,
	MapPin,
	Mic2,
	UserRound,
	X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

type SearchTab = "venues" | "artists";

type VenueSearchProps = {
	canSearchVenues: boolean;
	canSearchArtists: boolean;
};

const RESULTS_PER_PAGE = 9;

function parseOptionalNumber(value: string) {
	if (!value.trim()) {
		return undefined;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function formatRangeLabel(min?: number | null, max?: number | null) {
	if (min == null && max == null) {
		return "Cachet non renseigne";
	}

	if (min != null && max != null) {
		return `${min} € - ${max} €`;
	}

	if (min != null) {
		return `A partir de ${min} €`;
	}

	return `Jusqu'a ${max} €`;
}

function haveSameValues(left: string[], right: string[]) {
	return (
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}

export function VenueSearch({
	canSearchVenues,
	canSearchArtists,
}: VenueSearchProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState<SearchTab>(
		canSearchVenues ? "venues" : "artists",
	);
	const [city, setCity] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [selectedVenueType, setSelectedVenueType] = useState<string>("all");
	const [budgetMin, setBudgetMin] = useState("");
	const [budgetMax, setBudgetMax] = useState("");
	const [feeMin, setFeeMin] = useState("");
	const [feeMax, setFeeMax] = useState("");
	const [showAllGenres, setShowAllGenres] = useState(false);
	const [appliedSearch, setAppliedSearch] = useState(
		searchParams.get("q")?.trim() ?? "",
	);
	const [appliedCity, setAppliedCity] = useState("");
	const [appliedPostalCode, setAppliedPostalCode] = useState("");
	const [appliedGenres, setAppliedGenres] = useState<string[]>([]);
	const [appliedVenueType, setAppliedVenueType] = useState<string>("all");
	const [appliedBudgetMin, setAppliedBudgetMin] = useState("");
	const [appliedBudgetMax, setAppliedBudgetMax] = useState("");
	const [appliedFeeMin, setAppliedFeeMin] = useState("");
	const [appliedFeeMax, setAppliedFeeMax] = useState("");
	const normalizedQuery = searchParams.get("q")?.trim() ?? "";
	const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
	const currentPage =
		Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const showFilters = searchParams.get("filters") === "1";

	const venueSearchInput = useMemo(
		() => ({
			query: appliedSearch,
			genreNames: appliedGenres,
			city: appliedCity,
			postalCode: appliedPostalCode,
			venueTypes:
				appliedVenueType === "all"
					? []
					: [appliedVenueType as (typeof venueTypeValues)[number]],
			budgetMin: parseOptionalNumber(appliedBudgetMin),
			budgetMax: parseOptionalNumber(appliedBudgetMax),
		}),
		[
			appliedBudgetMax,
			appliedBudgetMin,
			appliedCity,
			appliedGenres,
			appliedPostalCode,
			appliedSearch,
			appliedVenueType,
		],
	);

	const artistSearchInput = useMemo(
		() => ({
			query: appliedSearch,
			genreNames: appliedGenres,
			city: appliedCity,
			postalCode: appliedPostalCode,
			feeMin: parseOptionalNumber(appliedFeeMin),
			feeMax: parseOptionalNumber(appliedFeeMax),
		}),
		[
			appliedCity,
			appliedFeeMax,
			appliedFeeMin,
			appliedGenres,
			appliedPostalCode,
			appliedSearch,
		],
	);

	const venueSearchQuery = useQuery({
		...trpc.venue.search.queryOptions(venueSearchInput),
		enabled: canSearchVenues && activeTab === "venues",
	});

	const artistSearchQuery = useQuery({
		...trpc.artist.search.queryOptions(artistSearchInput),
		enabled: canSearchArtists && activeTab === "artists",
	});

	const activeQuery =
		activeTab === "venues" ? venueSearchQuery : artistSearchQuery;
	const venueItems = venueSearchQuery.data ?? [];
	const artistItems = artistSearchQuery.data ?? [];
	const items = activeTab === "venues" ? venueItems : artistItems;
	const totalPages = Math.max(1, Math.ceil(items.length / RESULTS_PER_PAGE));
	const safePage = Math.min(currentPage, totalPages);
	const pageSliceStart = (safePage - 1) * RESULTS_PER_PAGE;
	const pageSliceEnd = safePage * RESULTS_PER_PAGE;
	const paginatedVenueItems = venueItems.slice(pageSliceStart, pageSliceEnd);
	const paginatedArtistItems = artistItems.slice(
		(safePage - 1) * RESULTS_PER_PAGE,
		safePage * RESULTS_PER_PAGE,
	);
	const hasResults = items.length > 0;
	const hasSearchError = activeQuery.isError;
	const isLoading = activeQuery.isLoading;
	const isFetching = activeQuery.isFetching;
	const visibleGenres = showAllGenres ? MUSIC_GENRES : MUSIC_GENRES.slice(0, 8);
	const activeFilterCount =
		(appliedSearch ? 1 : 0) +
		(appliedCity ? 1 : 0) +
		(appliedPostalCode ? 1 : 0) +
		appliedGenres.length +
		(activeTab === "venues"
			? (appliedVenueType !== "all" ? 1 : 0) +
				(appliedBudgetMin ? 1 : 0) +
				(appliedBudgetMax ? 1 : 0)
			: (appliedFeeMin ? 1 : 0) + (appliedFeeMax ? 1 : 0));
	const hasPendingChanges =
		city.trim() !== appliedCity ||
		postalCode.trim() !== appliedPostalCode ||
		!haveSameValues(selectedGenres, appliedGenres) ||
		selectedVenueType !== appliedVenueType ||
		budgetMin !== appliedBudgetMin ||
		budgetMax !== appliedBudgetMax ||
		feeMin !== appliedFeeMin ||
		feeMax !== appliedFeeMax;

	const resultLabel =
		hasSearchError && !hasResults
			? appliedSearch
				? `Resultats indisponibles pour "${appliedSearch}"`
				: "Resultats indisponibles"
			: appliedSearch
				? `${items.length} resultat(s) pour "${appliedSearch}"`
				: activeTab === "venues"
					? `${items.length} lieu(x) disponible(s)`
					: `${items.length} artiste(s) disponible(s)`;

	const description =
		canSearchVenues && canSearchArtists
			? "Explorez les profils disponibles sur Rythmons et affinez vos resultats avec des filtres simples de matching."
			: activeTab === "venues"
				? "Explorez les lieux et organisateurs deja presents sur Rythmons pour identifier ceux qui correspondent a votre projet."
				: "Explorez les artistes deja presents sur Rythmons pour identifier ceux qui correspondent a votre programmation.";

	useEffect(() => {
		setAppliedSearch(normalizedQuery);
	}, [normalizedQuery]);

	useEffect(() => {
		if (safePage === currentPage) {
			return;
		}

		updateRouteSearchParams((params) => {
			if (safePage <= 1) {
				params.delete("page");
				return;
			}

			params.set("page", String(safePage));
		});
	}, [currentPage, safePage]);

	function updateRouteSearchParams(mutate: (params: URLSearchParams) => void) {
		const params = new URLSearchParams(searchParams.toString());
		mutate(params);
		const query = params.toString();
		router.replace((query ? `${pathname}?${query}` : pathname) as Route, {
			scroll: false,
		});
	}

	function closeFilters() {
		updateRouteSearchParams((params) => {
			params.delete("filters");
		});
	}

	function setPage(page: number) {
		window.scrollTo({ top: 0, behavior: "smooth" });
		updateRouteSearchParams((params) => {
			if (page <= 1) {
				params.delete("page");
				return;
			}

			params.set("page", String(page));
		});
	}

	function handleTabChange(nextTab: SearchTab) {
		setActiveTab(nextTab);
		if (currentPage > 1) {
			setPage(1);
		}
	}

	function toggleGenre(genre: string) {
		setSelectedGenres((currentGenres) =>
			currentGenres.includes(genre)
				? currentGenres.filter((currentGenre) => currentGenre !== genre)
				: [...currentGenres, genre],
		);
	}

	function resetFilters() {
		setCity("");
		setPostalCode("");
		setSelectedGenres([]);
		setSelectedVenueType("all");
		setBudgetMin("");
		setBudgetMax("");
		setFeeMin("");
		setFeeMax("");
		setAppliedSearch("");
		setAppliedCity("");
		setAppliedPostalCode("");
		setAppliedGenres([]);
		setAppliedVenueType("all");
		setAppliedBudgetMin("");
		setAppliedBudgetMax("");
		setAppliedFeeMin("");
		setAppliedFeeMax("");
		updateRouteSearchParams((params) => {
			params.delete("q");
			params.delete("filters");
			params.delete("page");
		});
	}

	function applyFilters() {
		setAppliedSearch(normalizedQuery);
		setAppliedCity(city.trim());
		setAppliedPostalCode(postalCode.trim());
		setAppliedGenres(selectedGenres);
		setAppliedVenueType(selectedVenueType);
		setAppliedBudgetMin(budgetMin);
		setAppliedBudgetMax(budgetMax);
		setAppliedFeeMin(feeMin);
		setAppliedFeeMax(feeMax);
		if (currentPage > 1) {
			setPage(1);
		}
	}

	const hasAdvancedFilters =
		city.trim().length > 0 ||
		postalCode.trim().length > 0 ||
		selectedGenres.length > 0 ||
		(activeTab === "venues"
			? selectedVenueType !== "all" ||
				budgetMin.trim().length > 0 ||
				budgetMax.trim().length > 0
			: feeMin.trim().length > 0 || feeMax.trim().length > 0);

	const appliedFilterChips = [
		...(appliedSearch ? [`Recherche: ${appliedSearch}`] : []),
		...(appliedCity ? [`Ville: ${appliedCity}`] : []),
		...(appliedPostalCode ? [`CP: ${appliedPostalCode}`] : []),
		...appliedGenres,
		...(activeTab === "venues"
			? [
					...(appliedVenueType !== "all"
						? [
								getVenueTypeLabel(
									appliedVenueType as (typeof venueTypeValues)[number],
								),
							]
						: []),
					...(appliedBudgetMin ? [`Budget min ${appliedBudgetMin}€`] : []),
					...(appliedBudgetMax ? [`Budget max ${appliedBudgetMax}€`] : []),
				]
			: [
					...(appliedFeeMin ? [`Cachet min ${appliedFeeMin}€`] : []),
					...(appliedFeeMax ? [`Cachet max ${appliedFeeMax}€`] : []),
				]),
	];
	const filterSummary =
		activeFilterCount > 0
			? `${activeFilterCount} filtre(s) actif(s)`
			: activeTab === "venues"
				? "Ville, type de lieu, budget, genres"
				: "Ville, cachet, genres";
	const pageStart =
		items.length === 0 ? 0 : (safePage - 1) * RESULTS_PER_PAGE + 1;
	const pageEnd = Math.min(safePage * RESULTS_PER_PAGE, items.length);
	const paginationWindowStart = Math.max(1, safePage - 2);
	const paginationWindowEnd = Math.min(totalPages, paginationWindowStart + 4);
	const visiblePageNumbers = Array.from(
		{ length: paginationWindowEnd - paginationWindowStart + 1 },
		(_, index) => paginationWindowStart + index,
	);

	return (
		<div className="container mx-auto max-w-6xl px-4 py-5">
			<div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-wrap gap-2">
					{canSearchVenues && canSearchArtists ? (
						<>
							<Button
								type="button"
								size="sm"
								variant={activeTab === "venues" ? "default" : "outline"}
								onClick={() => handleTabChange("venues")}
							>
								Lieux
							</Button>
							<Button
								type="button"
								size="sm"
								variant={activeTab === "artists" ? "default" : "outline"}
								onClick={() => handleTabChange("artists")}
							>
								Artistes
							</Button>
						</>
					) : null}
					{hasAdvancedFilters || appliedFilterChips.length > 0 ? (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={resetFilters}
						>
							Tout effacer
						</Button>
					) : null}
				</div>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>

			{appliedFilterChips.length > 0 ? (
				<div className="mb-4 flex flex-wrap gap-2">
					{appliedFilterChips.map((chip) => (
						<Badge key={chip} variant="secondary" className="text-[11px]">
							{chip}
						</Badge>
					))}
				</div>
			) : null}

			<div className="mb-4 flex flex-col gap-2 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
				<p>{resultLabel}</p>
				<div className="flex flex-wrap items-center gap-3">
					{hasResults ? (
						<span>
							Affichage {pageStart}-{pageEnd} sur {items.length}
						</span>
					) : null}
					{isFetching && !isLoading ? (
						<span className="inline-flex items-center gap-2">
							<Loader2 className="h-4 w-4 animate-spin" />
							Mise a jour des resultats...
						</span>
					) : null}
				</div>
			</div>

			{hasSearchError ? (
				<Card className="mb-6 border-destructive/30" role="alert">
					<CardHeader>
						<CardTitle>
							Impossible de charger{" "}
							{activeTab === "venues" ? "les lieux" : "les artistes"}
						</CardTitle>
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
							onClick={() => activeQuery.refetch()}
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
						Chargement de {activeTab === "venues" ? "lieux" : "artistes"}...
					</p>
				</div>
			) : !hasResults ? (
				hasSearchError ? null : (
					<Card>
						<CardHeader>
							<CardTitle>
								Aucun {activeTab === "venues" ? "lieu" : "artiste"} trouve pour
								ces criteres
							</CardTitle>
							<CardDescription>
								Essayez un autre nom, une autre ville, un autre genre musical ou
								ajustez vos filtres.
							</CardDescription>
						</CardHeader>
					</Card>
				)
			) : (
				<div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
					{activeTab === "venues"
						? paginatedVenueItems.map((venue) => (
								<Card key={venue.id} className="h-full">
									<div className="relative h-40 overflow-hidden rounded-t-xl border-b bg-muted">
										{venue.photoUrl ? (
											/* biome-ignore lint/performance/noImgElement: venue photos are user-provided remote assets */
											<img
												src={venue.photoUrl}
												alt={venue.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-muted">
												<Building2 className="h-10 w-10 text-muted-foreground" />
											</div>
										)}
										<div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
										{venue.images.length > 0 ? (
											<Badge
												className="absolute top-3 right-3"
												variant="secondary"
											>
												{venue.images.length} photo(s)
											</Badge>
										) : null}
									</div>
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
							))
						: paginatedArtistItems.map((artist) => (
								<Card key={artist.id} className="h-full overflow-hidden">
									<div className="relative h-40 overflow-hidden border-b bg-muted">
										{artist.bannerUrl || artist.photoUrl ? (
											/* biome-ignore lint/performance/noImgElement: artist media are user-provided remote assets */
											<img
												src={artist.bannerUrl || artist.photoUrl || undefined}
												alt={artist.stageName}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-muted">
												<Mic2 className="h-10 w-10 text-muted-foreground" />
											</div>
										)}
										<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
										<div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
											<div className="min-w-0">
												<CardTitle className="truncate text-white text-xl drop-shadow-sm">
													{artist.stageName}
												</CardTitle>
												<CardDescription className="mt-1 text-white/85">
													<span className="inline-flex items-center gap-1">
														<MapPin className="h-3.5 w-3.5" />
														{artist.city || "Localisation non renseignee"}
													</span>
												</CardDescription>
											</div>
											{artist.images.length > 0 ? (
												<Badge variant="secondary">
													{artist.images.length} photo(s)
												</Badge>
											) : null}
										</div>
									</div>
									<CardHeader className="flex flex-row items-start gap-4 space-y-0">
										<div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
											{artist.photoUrl ? (
												/* biome-ignore lint/performance/noImgElement: artist photos are user-provided remote assets */
												<img
													src={artist.photoUrl}
													alt={artist.stageName}
													className="h-full w-full object-cover"
												/>
											) : (
												<Mic2 className="h-7 w-7 text-muted-foreground" />
											)}
										</div>

										<div className="min-w-0 flex-1">
											<CardTitle className="truncate text-xl">
												{artist.stageName}
											</CardTitle>
											<CardDescription className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
												<span className="inline-flex items-center gap-1">
													<MapPin className="h-3.5 w-3.5" />
													{artist.city || "Localisation non renseignee"}
												</span>
											</CardDescription>
										</div>
									</CardHeader>

									<CardContent className="space-y-4">
										<div className="flex flex-wrap gap-2">
											{artist.genres.length > 0 ? (
												artist.genres.slice(0, 4).map((genre) => (
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
											{artist.bio ||
												"Aucune description n'a encore ete ajoutee pour cet artiste."}
										</p>

										<p className="text-muted-foreground text-sm">
											{formatRangeLabel(artist.feeMin, artist.feeMax)}
										</p>
									</CardContent>

									<CardFooter className="mt-auto flex items-center justify-between gap-3">
										<span className="text-muted-foreground text-xs">
											{artist.postalCode || ""}
										</span>
										<Button asChild>
											<Link href={`/artist/${artist.id}`}>Voir profil</Link>
										</Button>
									</CardFooter>
								</Card>
							))}
				</div>
			)}

			{hasResults && totalPages > 1 ? (
				<div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-muted-foreground text-sm">
						Page {safePage} sur {totalPages}
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setPage(safePage - 1)}
							disabled={safePage === 1}
						>
							<ChevronLeft className="h-4 w-4" />
							Precedent
						</Button>
						{visiblePageNumbers.map((pageNumber) => (
							<Button
								key={pageNumber}
								type="button"
								variant={pageNumber === safePage ? "default" : "outline"}
								size="sm"
								onClick={() => setPage(pageNumber)}
							>
								{pageNumber}
							</Button>
						))}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setPage(safePage + 1)}
							disabled={safePage === totalPages}
						>
							Suivant
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			) : null}

			{showFilters ? (
				<div className="fixed inset-0 z-50 flex justify-end bg-black/50">
					<div className="flex h-full w-full max-w-xl flex-col bg-background shadow-2xl">
						<div className="flex items-start justify-between gap-4 border-b px-6 py-5">
							<div>
								<h2 className="font-semibold text-xl">Filtres</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									{activeTab === "venues"
										? "Affinez les lieux sans sortir de la page de resultats."
										: "Affinez les artistes sans sortir de la page de resultats."}
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={closeFilters}
							>
								<X className="h-5 w-5" />
							</Button>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-5">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="search-city">Ville</Label>
									<Input
										id="search-city"
										value={city}
										onChange={(event) => setCity(event.target.value)}
										placeholder="Ex. Paris"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="search-postal-code">Code postal</Label>
									<Input
										id="search-postal-code"
										value={postalCode}
										onChange={(event) => setPostalCode(event.target.value)}
										placeholder="Ex. 75011"
									/>
								</div>
							</div>

							{activeTab === "venues" ? (
								<div className="mt-5 grid gap-4 md:grid-cols-2">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="search-venue-type">Type de lieu</Label>
										<Select
											value={selectedVenueType}
											onValueChange={setSelectedVenueType}
										>
											<SelectTrigger id="search-venue-type">
												<SelectValue placeholder="Tous les types" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Tous les types</SelectItem>
												{venueTypeValues.map((venueType) => (
													<SelectItem key={venueType} value={venueType}>
														{getVenueTypeLabel(venueType)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="search-budget-min">Budget min (€)</Label>
										<Input
											id="search-budget-min"
											type="number"
											min="0"
											value={budgetMin}
											onChange={(event) => setBudgetMin(event.target.value)}
											placeholder="Ex. 300"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="search-budget-max">Budget max (€)</Label>
										<Input
											id="search-budget-max"
											type="number"
											min="0"
											value={budgetMax}
											onChange={(event) => setBudgetMax(event.target.value)}
											placeholder="Ex. 1200"
										/>
									</div>
								</div>
							) : (
								<div className="mt-5 grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="search-fee-min">Cachet min (€)</Label>
										<Input
											id="search-fee-min"
											type="number"
											min="0"
											value={feeMin}
											onChange={(event) => setFeeMin(event.target.value)}
											placeholder="Ex. 200"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="search-fee-max">Cachet max (€)</Label>
										<Input
											id="search-fee-max"
											type="number"
											min="0"
											value={feeMax}
											onChange={(event) => setFeeMax(event.target.value)}
											placeholder="Ex. 1000"
										/>
									</div>
								</div>
							)}

							<div className="mt-6 space-y-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<h3 className="font-medium text-sm">Genres musicaux</h3>
										<p className="text-muted-foreground text-xs">
											Affinez les resultats avec une ou plusieurs esthetiques.
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setShowAllGenres((current) => !current)}
									>
										{showAllGenres ? (
											<>
												<ChevronUp className="h-4 w-4" />
												Moins
											</>
										) : (
											<>
												<ChevronDown className="h-4 w-4" />
												Voir {MUSIC_GENRES.length - visibleGenres.length} de
												plus
											</>
										)}
									</Button>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									{visibleGenres.map((genreName) => {
										const checkboxId = `genre-${genreName.replace(/[^a-zA-Z0-9]/g, "-")}`;
										return (
											<div
												key={genreName}
												className="flex items-center gap-2 rounded-lg border p-2"
											>
												<Checkbox
													id={checkboxId}
													checked={selectedGenres.includes(genreName)}
													onCheckedChange={() => toggleGenre(genreName)}
												/>
												<Label htmlFor={checkboxId} className="text-sm">
													{genreName}
												</Label>
											</div>
										);
									})}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between gap-3 border-t px-6 py-4">
							<Button type="button" variant="ghost" onClick={resetFilters}>
								Reinitialiser
							</Button>
							<div className="flex items-center gap-2">
								<Button type="button" variant="outline" onClick={closeFilters}>
									Fermer
								</Button>
								<Button
									type="button"
									onClick={() => {
										applyFilters();
										closeFilters();
									}}
									disabled={!hasPendingChanges}
								>
									Appliquer
								</Button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
