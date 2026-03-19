import { Ionicons } from "@expo/vector-icons";
import type { AppRouter } from "@rythmons/api";
import { MUSIC_GENRES, venueTypeValues } from "@rythmons/validation";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScrollView as ScrollViewType } from "react-native";
import {
	ActivityIndicator,
	Image,
	Modal,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { Input } from "@/components/ui/input";
import { SearchMap } from "@/components/ui/search-map";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

type SearchVenueItem = inferRouterOutputs<AppRouter>["venue"]["search"][number];
type SearchArtistItem =
	inferRouterOutputs<AppRouter>["artist"]["search"][number];

type ArtistListItem = {
	id: string;
};

type VenueListItem = {
	id: string;
};

type SearchTab = "venues" | "artists";

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

export default function VenueSearchScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const scrollViewRef = useRef<ScrollViewType>(null);
	const [activeTab, setActiveTab] = useState<SearchTab>("venues");
	const [search, setSearch] = useState("");
	const [city, setCity] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [selectedVenueType, setSelectedVenueType] = useState<string>("");
	const [budgetMin, setBudgetMin] = useState("");
	const [budgetMax, setBudgetMax] = useState("");
	const [feeMin, setFeeMin] = useState("");
	const [feeMax, setFeeMax] = useState("");
	const [radiusKm, setRadiusKm] = useState<number | null>(null);
	const [useMyLocation, setUseMyLocation] = useState(false);
	const [myLocationCoords, setMyLocationCoords] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [locationStatus, setLocationStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [currentPage, setCurrentPage] = useState(1);
	const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
	const [showAllGenres, setShowAllGenres] = useState(false);
	const [showAllVenueTypes, setShowAllVenueTypes] = useState(false);
	const [viewMode, setViewMode] = useState<"list" | "map">("list");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [appliedCity, setAppliedCity] = useState("");
	const [appliedPostalCode, setAppliedPostalCode] = useState("");
	const [appliedGenres, setAppliedGenres] = useState<string[]>([]);
	const [appliedVenueType, setAppliedVenueType] = useState<string>("");
	const [appliedBudgetMin, setAppliedBudgetMin] = useState("");
	const [appliedBudgetMax, setAppliedBudgetMax] = useState("");
	const [appliedFeeMin, setAppliedFeeMin] = useState("");
	const [appliedFeeMax, setAppliedFeeMax] = useState("");
	const [appliedRadiusKm, setAppliedRadiusKm] = useState<number | null>(null);
	const [appliedUserCoords, setAppliedUserCoords] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const normalizedQuery = useMemo(() => search.trim(), [search]);
	const sessionRole = (
		session?.user as
			| {
					role?: "ARTIST" | "ORGANIZER" | "BOTH" | null;
			  }
			| undefined
	)?.role;
	const hasArtistRole = sessionRole === "ARTIST" || sessionRole === "BOTH";
	const hasOrganizerRole =
		sessionRole === "ORGANIZER" || sessionRole === "BOTH";

	const artistsQuery = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user) && !hasArtistRole,
	});

	const venuesQuery = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user) && !hasOrganizerRole,
	});

	const artistItems = (artistsQuery.data ?? []) as ArtistListItem[];
	const venueItems = (venuesQuery.data ?? []) as VenueListItem[];
	const canSearchVenues = hasArtistRole || artistItems.length > 0;
	const canSearchArtists = hasOrganizerRole || venueItems.length > 0;
	const canUseSearch = canSearchVenues || canSearchArtists;

	useEffect(() => {
		if (!canSearchVenues && canSearchArtists) {
			setActiveTab("artists");
			return;
		}

		if (!canSearchArtists && canSearchVenues) {
			setActiveTab("venues");
		}
	}, [canSearchArtists, canSearchVenues]);

	const venueSearchInput = useMemo(
		() => ({
			query: appliedSearch,
			genreNames: appliedGenres,
			city: appliedCity,
			postalCode: appliedPostalCode,
			radiusKm: appliedRadiusKm ?? undefined,
			userLat: appliedUserCoords?.lat,
			userLng: appliedUserCoords?.lng,
			venueTypes: appliedVenueType
				? [appliedVenueType as (typeof venueTypeValues)[number]]
				: [],
			budgetMin: parseOptionalNumber(appliedBudgetMin),
			budgetMax: parseOptionalNumber(appliedBudgetMax),
		}),
		[
			appliedBudgetMax,
			appliedBudgetMin,
			appliedCity,
			appliedGenres,
			appliedPostalCode,
			appliedRadiusKm,
			appliedSearch,
			appliedUserCoords,
			appliedVenueType,
		],
	);

	const artistSearchInput = useMemo(
		() => ({
			query: appliedSearch,
			genreNames: appliedGenres,
			city: appliedCity,
			postalCode: appliedPostalCode,
			radiusKm: appliedRadiusKm ?? undefined,
			userLat: appliedUserCoords?.lat,
			userLng: appliedUserCoords?.lng,
			feeMin: parseOptionalNumber(appliedFeeMin),
			feeMax: parseOptionalNumber(appliedFeeMax),
		}),
		[
			appliedCity,
			appliedFeeMax,
			appliedFeeMin,
			appliedGenres,
			appliedPostalCode,
			appliedRadiusKm,
			appliedSearch,
			appliedUserCoords,
		],
	);

	const venueSearchQuery = useQuery({
		...trpc.venue.search.queryOptions(venueSearchInput),
		enabled:
			Boolean(session?.user) && canSearchVenues && activeTab === "venues",
	});

	const artistSearchQuery = useQuery({
		...trpc.artist.search.queryOptions(artistSearchInput),
		enabled:
			Boolean(session?.user) && canSearchArtists && activeTab === "artists",
	});

	const venues = (venueSearchQuery.data ?? []) as SearchVenueItem[];
	const artists = (artistSearchQuery.data ?? []) as SearchArtistItem[];
	const activeItems = activeTab === "venues" ? venues : artists;
	const totalPages = Math.max(
		1,
		Math.ceil(activeItems.length / RESULTS_PER_PAGE),
	);
	const safePage = Math.min(currentPage, totalPages);
	const pageSliceStart = (safePage - 1) * RESULTS_PER_PAGE;
	const pageSliceEnd = safePage * RESULTS_PER_PAGE;
	const paginatedVenueItems = venues.slice(pageSliceStart, pageSliceEnd);
	const paginatedArtistItems = artists.slice(pageSliceStart, pageSliceEnd);
	const pageStart = activeItems.length === 0 ? 0 : pageSliceStart + 1;
	const pageEnd = Math.min(pageSliceEnd, activeItems.length);
	const paginationWindowStart = Math.max(1, safePage - 2);
	const paginationWindowEnd = Math.min(totalPages, paginationWindowStart + 4);
	const visiblePageNumbers = Array.from(
		{ length: paginationWindowEnd - paginationWindowStart + 1 },
		(_, i) => paginationWindowStart + i,
	);
	const activeQuery =
		activeTab === "venues" ? venueSearchQuery : artistSearchQuery;
	const visibleGenres = showAllGenres ? MUSIC_GENRES : MUSIC_GENRES.slice(0, 8);
	const visibleVenueTypes = showAllVenueTypes
		? venueTypeValues
		: venueTypeValues.slice(0, 4);
	const activeFilterCount =
		(appliedSearch ? 1 : 0) +
		(appliedCity ? 1 : 0) +
		(appliedPostalCode ? 1 : 0) +
		(appliedRadiusKm != null ? 1 : 0) +
		(appliedUserCoords != null ? 1 : 0) +
		appliedGenres.length +
		(activeTab === "venues"
			? (appliedVenueType ? 1 : 0) +
				(appliedBudgetMin ? 1 : 0) +
				(appliedBudgetMax ? 1 : 0)
			: (appliedFeeMin ? 1 : 0) + (appliedFeeMax ? 1 : 0));
	const hasPendingChanges =
		normalizedQuery !== appliedSearch ||
		city.trim() !== appliedCity ||
		postalCode.trim() !== appliedPostalCode ||
		radiusKm !== appliedRadiusKm ||
		useMyLocation !== (appliedUserCoords != null) ||
		!haveSameValues(selectedGenres, appliedGenres) ||
		selectedVenueType !== appliedVenueType ||
		budgetMin !== appliedBudgetMin ||
		budgetMax !== appliedBudgetMax ||
		feeMin !== appliedFeeMin ||
		feeMax !== appliedFeeMax;

	async function handleMyLocationToggle() {
		if (useMyLocation) {
			setUseMyLocation(false);
			setMyLocationCoords(null);
			setLocationStatus("idle");
			return;
		}
		setLocationStatus("loading");
		const { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			setLocationStatus("error");
			return;
		}
		const pos = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});
		setMyLocationCoords({
			lat: pos.coords.latitude,
			lng: pos.coords.longitude,
		});
		setUseMyLocation(true);
		setLocationStatus("success");
	}

	function toggleGenre(genreName: string) {
		setSelectedGenres((currentGenres) =>
			currentGenres.includes(genreName)
				? currentGenres.filter((currentGenre) => currentGenre !== genreName)
				: [...currentGenres, genreName],
		);
	}

	function goToPage(page: number) {
		setCurrentPage(page);
		scrollViewRef.current?.scrollTo({ y: 0, animated: true });
	}

	function scrollToTop() {
		scrollViewRef.current?.scrollTo({ y: 0, animated: true });
	}

	function resetFilters() {
		setCurrentPage(1);
		scrollToTop();
		setSearch("");
		setCity("");
		setPostalCode("");
		setRadiusKm(null);
		setUseMyLocation(false);
		setMyLocationCoords(null);
		setLocationStatus("idle");
		setSelectedGenres([]);
		setSelectedVenueType("");
		setBudgetMin("");
		setBudgetMax("");
		setFeeMin("");
		setFeeMax("");
		setAppliedSearch("");
		setAppliedCity("");
		setAppliedPostalCode("");
		setAppliedRadiusKm(null);
		setAppliedUserCoords(null);
		setAppliedGenres([]);
		setAppliedVenueType("");
		setAppliedBudgetMin("");
		setAppliedBudgetMax("");
		setAppliedFeeMin("");
		setAppliedFeeMax("");
	}

	function applyFilters() {
		setCurrentPage(1);
		scrollToTop();
		setAppliedSearch(normalizedQuery);
		setAppliedCity(city.trim());
		setAppliedPostalCode(postalCode.trim());
		setAppliedRadiusKm(radiusKm);
		setAppliedUserCoords(
			useMyLocation && myLocationCoords ? myLocationCoords : null,
		);
		setAppliedGenres(selectedGenres);
		setAppliedVenueType(selectedVenueType);
		setAppliedBudgetMin(budgetMin);
		setAppliedBudgetMax(budgetMax);
		setAppliedFeeMin(feeMin);
		setAppliedFeeMax(feeMax);
	}

	function applyFiltersAndClose() {
		applyFilters();
		setIsFilterModalOpen(false);
	}

	const hasAdvancedFilters =
		city.trim().length > 0 ||
		postalCode.trim().length > 0 ||
		radiusKm != null ||
		useMyLocation ||
		selectedGenres.length > 0 ||
		(activeTab === "venues"
			? selectedVenueType.length > 0 ||
				budgetMin.trim().length > 0 ||
				budgetMax.trim().length > 0
			: feeMin.trim().length > 0 || feeMax.trim().length > 0);

	const appliedFilterChips = [
		...(appliedSearch ? [`Recherche: ${appliedSearch}`] : []),
		...(appliedCity ? [`Ville: ${appliedCity}`] : []),
		...(appliedPostalCode ? [`CP: ${appliedPostalCode}`] : []),
		...(appliedUserCoords != null ? ["Ma position"] : []),
		...(appliedRadiusKm != null ? [`Rayon: ${appliedRadiusKm} km`] : []),
		...appliedGenres,
		...(activeTab === "venues"
			? [
					...(appliedVenueType
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

	if (
		sessionPending ||
		(session?.user && !hasArtistRole && artistsQuery.isLoading) ||
		(session?.user && !hasOrganizerRole && venuesQuery.isLoading)
	) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
					<Text className="mt-2 text-muted-foreground">Chargement...</Text>
				</View>
			</Container>
		);
	}

	if (!session?.user) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Title className="mb-2 text-center text-2xl">Recherche</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Connectez-vous pour rechercher des lieux et des artistes.
					</Text>
					<TouchableOpacity
						className="rounded-lg bg-primary px-4 py-2"
						onPress={() => router.replace("/")}
					>
						<Text className="font-sans-medium text-primary-foreground">
							Se connecter
						</Text>
					</TouchableOpacity>
				</View>
			</Container>
		);
	}

	if (!canUseSearch) {
		return (
			<Container>
				<View className="flex-1 justify-center px-6">
					<Title className="mb-2 text-center text-2xl">
						Recherche indisponible
					</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Pour utiliser la recherche, renseignez un role artiste ou
						organisateur, ou creez un profil correspondant.
					</Text>
					<View className="flex-row gap-3">
						<TouchableOpacity
							className="flex-1 rounded-lg border border-border bg-card px-4 py-3"
							onPress={() => router.push("/(drawer)/profile")}
						>
							<Text className="text-center font-sans-medium text-foreground">
								Mon profil
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className="flex-1 rounded-lg bg-primary px-4 py-3"
							onPress={() => router.push("/(drawer)/artist/new")}
						>
							<Text className="text-center font-sans-medium text-primary-foreground">
								Creer un artiste
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Container>
		);
	}

	const heading =
		canSearchVenues && canSearchArtists
			? "Recherche"
			: canSearchVenues
				? "Rechercher des lieux"
				: "Rechercher des artistes";

	const subheading =
		activeTab === "venues"
			? "Trouvez des lieux et organisateurs deja presents sur Rythmons."
			: "Trouvez des artistes deja presents sur Rythmons pour vos programmations.";
	const filterSummary =
		activeFilterCount > 0
			? `${activeFilterCount} filtre(s) actif(s)`
			: activeTab === "venues"
				? "Ville, type de lieu, budget, genres"
				: "Ville, cachet, genres";

	return (
		<Container>
			{viewMode === "map" && activeTab === "venues" ? (
				<>
					<View className="flex-row items-center justify-between border-border border-b px-4 py-3">
						<Text className="text-muted-foreground text-sm">
							{venues.length} lieu(x) sur la carte
						</Text>
						<View className="flex-row gap-2">
							<TouchableOpacity
								className="rounded-full border border-border bg-card px-3 py-1.5"
								onPress={() => setIsFilterModalOpen(true)}
							>
								<Text className="text-foreground text-xs">
									Filtres
									{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className="rounded-full border border-border bg-card px-3 py-1.5"
								onPress={() => setViewMode("list")}
							>
								<Text className="text-foreground text-xs">Liste</Text>
							</TouchableOpacity>
						</View>
					</View>
					<SearchMap venues={venues} />
				</>
			) : (
				<ScrollView ref={scrollViewRef} className="flex-1 p-4">
					<View className="mb-6">
						<Title className="text-2xl text-foreground">{heading}</Title>
						<Text className="mt-1 text-muted-foreground">{subheading}</Text>
					</View>

					{canSearchVenues && canSearchArtists ? (
						<View className="mb-4 flex-row gap-3">
							<TouchableOpacity
								className={`flex-1 rounded-lg px-4 py-3 ${
									activeTab === "venues"
										? "bg-primary"
										: "border border-border bg-card"
								}`}
								onPress={() => {
									setActiveTab("venues");
									setCurrentPage(1);
									scrollToTop();
								}}
							>
								<Text
									className={`text-center font-sans-medium ${
										activeTab === "venues"
											? "text-primary-foreground"
											: "text-foreground"
									}`}
								>
									Lieux
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`flex-1 rounded-lg px-4 py-3 ${
									activeTab === "artists"
										? "bg-primary"
										: "border border-border bg-card"
								}`}
								onPress={() => {
									setActiveTab("artists");
									setCurrentPage(1);
									scrollToTop();
								}}
							>
								<Text
									className={`text-center font-sans-medium ${
										activeTab === "artists"
											? "text-primary-foreground"
											: "text-foreground"
									}`}
								>
									Artistes
								</Text>
							</TouchableOpacity>
						</View>
					) : null}

					<View className="mb-4 rounded-xl border border-border bg-card p-4">
						<View className="mb-3 flex-row items-start justify-between gap-3">
							<View className="flex-1">
								<Text className="font-sans-medium text-foreground">
									Recherche rapide
								</Text>
								<Text className="mt-1 text-muted-foreground text-xs">
									{filterSummary}
								</Text>
							</View>
							<TouchableOpacity
								className="rounded-full border border-border bg-background px-4 py-2"
								onPress={() => setIsFilterModalOpen(true)}
							>
								<Text className="font-sans-medium text-foreground text-sm">
									Filtres
									{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
								</Text>
							</TouchableOpacity>
						</View>
						<View className="flex-row items-center rounded-lg border border-border bg-background px-3">
							<Ionicons name="search-outline" size={18} color="#9ca3af" />
							<Input
								className="flex-1 px-3 py-3 text-foreground"
								value={search}
								onChangeText={setSearch}
								onSubmitEditing={applyFilters}
								placeholder="Nom, ville, code postal, genre..."
								placeholderTextColor="#9ca3af"
								autoCapitalize="none"
								autoCorrect={false}
							/>
							<TouchableOpacity
								className={`rounded-full px-3 py-2 ${
									hasPendingChanges ? "bg-primary" : "bg-muted"
								}`}
								onPress={applyFilters}
								disabled={!hasPendingChanges}
							>
								<Text className="font-sans-medium text-primary-foreground text-xs">
									Go
								</Text>
							</TouchableOpacity>
						</View>
						<View className="mt-4 flex-row items-center justify-between gap-3">
							<Text className="text-muted-foreground text-xs">
								{hasPendingChanges
									? "Des changements sont prets a etre appliques."
									: "Les resultats affichent votre derniere recherche appliquee."}
							</Text>
							{hasAdvancedFilters || appliedFilterChips.length > 0 ? (
								<TouchableOpacity onPress={resetFilters}>
									<Text className="text-primary text-xs">Tout effacer</Text>
								</TouchableOpacity>
							) : null}
						</View>

						{appliedFilterChips.length > 0 ? (
							<View className="mt-3 flex-row flex-wrap gap-2">
								{appliedFilterChips.map((chip) => (
									<View
										key={chip}
										className="rounded-full border border-border bg-background px-3 py-2"
									>
										<Text className="text-foreground text-xs">{chip}</Text>
									</View>
								))}
							</View>
						) : null}
					</View>

					<View className="mb-4 flex-row items-center justify-between">
						<Text className="text-muted-foreground text-sm">
							{appliedSearch
								? `${activeItems.length} resultat(s) pour "${appliedSearch}"`
								: activeTab === "venues"
									? `${activeItems.length} lieu(x) disponible(s)`
									: `${activeItems.length} artiste(s) disponible(s)`}
						</Text>
						<View className="flex-row items-center gap-3">
							{activeItems.length > 0 ? (
								<Text className="text-muted-foreground text-xs">
									{pageStart}-{pageEnd} sur {activeItems.length}
								</Text>
							) : null}
							{activeQuery.isFetching && !activeQuery.isLoading ? (
								<Text className="text-muted-foreground text-xs">
									Mise a jour...
								</Text>
							) : null}
						</View>
					</View>

					{activeTab === "venues" &&
					activeItems.length > 0 &&
					!activeQuery.isLoading &&
					!activeQuery.isError ? (
						<View className="mb-4 flex-row items-center rounded-lg border border-border bg-card p-1">
							<TouchableOpacity
								className={`flex-1 items-center rounded-md py-2 ${viewMode === "list" ? "bg-primary" : ""}`}
								onPress={() => setViewMode("list")}
							>
								<Text
									className={`font-sans-medium text-sm ${viewMode === "list" ? "text-primary-foreground" : "text-foreground"}`}
								>
									Liste
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`flex-1 items-center rounded-md py-2 ${viewMode === "map" ? "bg-primary" : ""}`}
								onPress={() => setViewMode("map")}
							>
								<Text
									className={`font-sans-medium text-sm ${viewMode === "map" ? "text-primary-foreground" : "text-foreground"}`}
								>
									Carte
								</Text>
							</TouchableOpacity>
						</View>
					) : null}

					{activeQuery.isLoading ? (
						<View className="rounded-xl border border-border bg-card p-6">
							<ActivityIndicator size="large" />
							<Text className="mt-3 text-center text-muted-foreground">
								Chargement des resultats...
							</Text>
						</View>
					) : activeQuery.isError ? (
						<View className="rounded-xl border border-destructive/30 bg-card p-4">
							<Text className="font-sans-medium text-destructive">
								Impossible de charger les resultats.
							</Text>
							<Text className="mt-1 text-muted-foreground">
								Verifiez votre connexion puis reessayez.
							</Text>
						</View>
					) : activeItems.length === 0 ? (
						<View className="rounded-xl border border-border bg-card p-4">
							<Text className="font-sans-bold text-foreground">
								Aucun {activeTab === "venues" ? "lieu" : "artiste"} trouve pour
								ces criteres
							</Text>
							<Text className="mt-2 text-muted-foreground">
								Essayez une autre ville, un autre genre ou ajustez vos filtres.
							</Text>
						</View>
					) : (
						<View className="gap-3">
							{activeTab === "venues"
								? paginatedVenueItems.map((venue) => {
										const genreLabel = venue.genres.length
											? venue.genres.map((genre) => genre.name).join(" • ")
											: "Genres non renseignes";

										return (
											<TouchableOpacity
												key={venue.id}
												className="overflow-hidden rounded-xl border border-border bg-card"
												onPress={() =>
													router.push({
														pathname: "/(drawer)/venue/[id]",
														params: {
															id: venue.id,
															backTo: "/(drawer)/search",
														},
													})
												}
											>
												{venue.photoUrl ? (
													<Image
														source={{ uri: venue.photoUrl }}
														className="h-28 w-full"
														resizeMode="cover"
													/>
												) : (
													<View className="h-28 w-full bg-primary/10" />
												)}

												<View className="p-4">
													<View className="mb-3 flex-row items-center gap-3">
														{venue.logoUrl ? (
															<Image
																source={{ uri: venue.logoUrl }}
																className="h-12 w-12 rounded-lg border border-border"
															/>
														) : (
															<View className="h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
																<Ionicons
																	name="business-outline"
																	size={22}
																	color="#7c3aed"
																/>
															</View>
														)}

														<View className="flex-1">
															<Title className="text-foreground text-lg">
																{venue.name}
															</Title>
															<Text className="text-muted-foreground text-sm">
																{venue.city} •{" "}
																{getVenueTypeLabel(venue.venueType)}
															</Text>
														</View>

														<Ionicons
															name="chevron-forward"
															size={18}
															color="#9ca3af"
														/>
													</View>

													<Text className="mb-2 text-muted-foreground text-sm">
														Organisateur : {venue.owner.name}
													</Text>
													<Text className="mb-2 text-muted-foreground text-sm">
														{genreLabel}
													</Text>
													<Text
														className="text-muted-foreground"
														numberOfLines={3}
													>
														{venue.description ||
															"Aucune description n'a encore ete ajoutee pour ce lieu."}
													</Text>
												</View>
											</TouchableOpacity>
										);
									})
								: paginatedArtistItems.map((artist) => {
										const genreLabel = artist.genres.length
											? artist.genres.map((genre) => genre.name).join(" • ")
											: "Genres non renseignes";

										return (
											<TouchableOpacity
												key={artist.id}
												className="overflow-hidden rounded-xl border border-border bg-card"
												onPress={() =>
													router.push({
														pathname: "/(drawer)/artist/[id]",
														params: {
															id: artist.id,
															backTo: "/(drawer)/search",
														},
													})
												}
											>
												{artist.bannerUrl || artist.photoUrl ? (
													<View className="relative">
														<Image
															source={{
																uri:
																	artist.bannerUrl ||
																	artist.photoUrl ||
																	undefined,
															}}
															className="h-32 w-full"
															resizeMode="cover"
														/>
														<View className="absolute inset-0 bg-black/25" />
														{artist.images.length > 0 ? (
															<View className="absolute top-3 right-3 rounded-full bg-background/90 px-3 py-1">
																<Text className="font-sans-medium text-foreground text-xs">
																	{artist.images.length} photo(s)
																</Text>
															</View>
														) : null}
													</View>
												) : null}

												<View className="p-4">
													<View className="mb-3 flex-row items-center gap-3">
														{artist.photoUrl ? (
															<Image
																source={{ uri: artist.photoUrl }}
																className="h-14 w-14 rounded-full border border-border"
															/>
														) : (
															<View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
																<Ionicons
																	name="musical-notes-outline"
																	size={24}
																	color="#7c3aed"
																/>
															</View>
														)}

														<View className="flex-1">
															<Title className="text-foreground text-lg">
																{artist.stageName}
															</Title>
															<Text className="text-muted-foreground text-sm">
																{artist.city || "Localisation non renseignee"}
															</Text>
														</View>
														<Ionicons
															name="chevron-forward"
															size={18}
															color="#9ca3af"
														/>
													</View>
													<Text className="mb-2 text-muted-foreground text-sm">
														{genreLabel}
													</Text>
													<Text className="mb-2 text-muted-foreground text-sm">
														{formatRangeLabel(artist.feeMin, artist.feeMax)}
													</Text>
													<Text
														className="text-muted-foreground"
														numberOfLines={3}
													>
														{artist.bio ||
															"Aucune description n'a encore ete ajoutee pour cet artiste."}
													</Text>
												</View>
											</TouchableOpacity>
										);
									})}
						</View>
					)}

					{activeItems.length > 0 && totalPages > 1 ? (
						<View className="mt-6 items-center gap-3 border-border border-t pt-5">
							<Text className="text-muted-foreground text-sm">
								Page {safePage} sur {totalPages}
							</Text>
							<View className="flex-row flex-wrap justify-center gap-2">
								<TouchableOpacity
									className={`rounded-lg border px-4 py-2 ${
										safePage === 1
											? "border-border bg-muted opacity-40"
											: "border-border bg-card"
									}`}
									onPress={() => goToPage(safePage - 1)}
									disabled={safePage === 1}
								>
									<Text className="font-sans-medium text-foreground text-sm">
										← Préc.
									</Text>
								</TouchableOpacity>
								{visiblePageNumbers.map((pageNumber) => (
									<TouchableOpacity
										key={pageNumber}
										className={`h-9 w-9 items-center justify-center rounded-lg border ${
											pageNumber === safePage
												? "border-primary bg-primary"
												: "border-border bg-card"
										}`}
										onPress={() => goToPage(pageNumber)}
									>
										<Text
											className={`font-sans-medium text-sm ${
												pageNumber === safePage
													? "text-primary-foreground"
													: "text-foreground"
											}`}
										>
											{pageNumber}
										</Text>
									</TouchableOpacity>
								))}
								<TouchableOpacity
									className={`rounded-lg border px-4 py-2 ${
										safePage === totalPages
											? "border-border bg-muted opacity-40"
											: "border-border bg-card"
									}`}
									onPress={() => goToPage(safePage + 1)}
									disabled={safePage === totalPages}
								>
									<Text className="font-sans-medium text-foreground text-sm">
										Suiv. →
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					) : null}

					<View className="h-8" />
				</ScrollView>
			)}

			<Modal
				animationType="slide"
				transparent
				visible={isFilterModalOpen}
				onRequestClose={() => setIsFilterModalOpen(false)}
			>
				<View className="flex-1 justify-end bg-black/50">
					<View className="max-h-[88%] rounded-t-3xl bg-background px-4 pt-4 pb-6">
						<View className="mb-4 flex-row items-center justify-between gap-3">
							<View>
								<Title className="text-foreground text-xl">Filtres</Title>
								<Text className="mt-1 text-muted-foreground text-sm">
									{activeTab === "venues"
										? "Affinez les lieux sans quitter les resultats."
										: "Affinez les artistes sans quitter les resultats."}
								</Text>
							</View>
							<TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
								<Text className="font-sans-medium text-primary">Fermer</Text>
							</TouchableOpacity>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							<View className="gap-4 pb-4">
								<View className="flex-row gap-3">
									<Input
										className="flex-1"
										value={city}
										onChangeText={setCity}
										placeholder="Ville"
										placeholderTextColor="#9ca3af"
									/>
									<Input
										className="flex-1"
										value={postalCode}
										onChangeText={setPostalCode}
										placeholder="Code postal"
										placeholderTextColor="#9ca3af"
									/>
								</View>

								<View>
									<View className="mb-2 flex-row items-center justify-between">
										<Text className="font-sans-medium text-foreground">
											Rayon
										</Text>
										<TouchableOpacity
											className={`flex-row items-center gap-1 rounded-full border px-3 py-1.5 ${
												useMyLocation
													? "border-primary bg-primary"
													: "border-border bg-background"
											}`}
											onPress={handleMyLocationToggle}
											disabled={locationStatus === "loading"}
										>
											<Ionicons
												name={
													locationStatus === "loading"
														? "reload"
														: "location-outline"
												}
												size={12}
												color={useMyLocation ? "white" : undefined}
											/>
											<Text
												className={`ml-1 text-xs ${useMyLocation ? "text-primary-foreground" : "text-foreground"}`}
											>
												{locationStatus === "loading"
													? "Localisation..."
													: "Ma position"}
											</Text>
										</TouchableOpacity>
									</View>
									<View className="flex-row flex-wrap gap-2">
										{[null, 10, 25, 50, 100, 200].map((km) => {
											const isSelected = radiusKm === km;
											return (
												<TouchableOpacity
													key={km ?? "none"}
													className={`rounded-full border px-3 py-2 ${
														isSelected
															? "border-primary bg-primary"
															: "border-border bg-background"
													}`}
													onPress={() => setRadiusKm(km)}
												>
													<Text
														className={`text-xs ${isSelected ? "text-primary-foreground" : "text-foreground"}`}
													>
														{km == null ? "Pas de limite" : `${km} km`}
													</Text>
												</TouchableOpacity>
											);
										})}
									</View>
									{useMyLocation && locationStatus === "success" ? (
										<Text className="mt-1 text-green-600 text-xs">
											✓ Position obtenue
										</Text>
									) : locationStatus === "error" ? (
										<Text className="mt-1 text-destructive text-xs">
											Impossible d&apos;obtenir votre position.
										</Text>
									) : !useMyLocation &&
										radiusKm != null &&
										!city.trim() &&
										!postalCode.trim() ? (
										<Text className="mt-1 text-muted-foreground text-xs">
											Saisissez une ville ou un CP pour activer le rayon.
										</Text>
									) : null}
								</View>

								{activeTab === "venues" ? (
									<>
										<View>
											<View className="mb-2 flex-row items-center justify-between gap-3">
												<Text className="font-sans-medium text-foreground">
													Type de lieu
												</Text>
												{venueTypeValues.length > visibleVenueTypes.length ? (
													<TouchableOpacity
														onPress={() =>
															setShowAllVenueTypes((current) => !current)
														}
													>
														<Text className="text-primary text-xs">
															{showAllVenueTypes
																? "Voir moins"
																: `Voir ${venueTypeValues.length - visibleVenueTypes.length} de plus`}
														</Text>
													</TouchableOpacity>
												) : null}
											</View>
											<View className="flex-row flex-wrap gap-2">
												{visibleVenueTypes.map((venueType) => {
													const isSelected = selectedVenueType === venueType;
													return (
														<TouchableOpacity
															key={venueType}
															className={`rounded-full border px-3 py-2 ${
																isSelected
																	? "border-primary bg-primary"
																	: "border-border bg-background"
															}`}
															onPress={() =>
																setSelectedVenueType((currentType) =>
																	currentType === venueType ? "" : venueType,
																)
															}
														>
															<Text
																className={`text-xs ${
																	isSelected
																		? "text-primary-foreground"
																		: "text-foreground"
																}`}
															>
																{getVenueTypeLabel(venueType)}
															</Text>
														</TouchableOpacity>
													);
												})}
											</View>
										</View>

										<View className="flex-row gap-3">
											<Input
												className="flex-1"
												value={budgetMin}
												onChangeText={setBudgetMin}
												placeholder="Budget min (€)"
												placeholderTextColor="#9ca3af"
												keyboardType="numeric"
											/>
											<Input
												className="flex-1"
												value={budgetMax}
												onChangeText={setBudgetMax}
												placeholder="Budget max (€)"
												placeholderTextColor="#9ca3af"
												keyboardType="numeric"
											/>
										</View>
									</>
								) : (
									<View className="flex-row gap-3">
										<Input
											className="flex-1"
											value={feeMin}
											onChangeText={setFeeMin}
											placeholder="Cachet min (€)"
											placeholderTextColor="#9ca3af"
											keyboardType="numeric"
										/>
										<Input
											className="flex-1"
											value={feeMax}
											onChangeText={setFeeMax}
											placeholder="Cachet max (€)"
											placeholderTextColor="#9ca3af"
											keyboardType="numeric"
										/>
									</View>
								)}

								<View>
									<View className="mb-2 flex-row items-center justify-between gap-3">
										<Text className="font-sans-medium text-foreground">
											Genres
										</Text>
										{MUSIC_GENRES.length > visibleGenres.length ? (
											<TouchableOpacity
												onPress={() => setShowAllGenres((current) => !current)}
											>
												<Text className="text-primary text-xs">
													{showAllGenres
														? "Voir moins"
														: `Voir ${MUSIC_GENRES.length - visibleGenres.length} de plus`}
												</Text>
											</TouchableOpacity>
										) : null}
									</View>
									<View className="flex-row flex-wrap gap-2">
										{visibleGenres.map((genreName) => {
											const isSelected = selectedGenres.includes(genreName);
											return (
												<TouchableOpacity
													key={genreName}
													className={`rounded-full border px-3 py-2 ${
														isSelected
															? "border-primary bg-primary"
															: "border-border bg-background"
													}`}
													onPress={() => toggleGenre(genreName)}
												>
													<Text
														className={`text-xs ${
															isSelected
																? "text-primary-foreground"
																: "text-foreground"
														}`}
													>
														{genreName}
													</Text>
												</TouchableOpacity>
											);
										})}
									</View>
								</View>
							</View>
						</ScrollView>

						<View className="mt-4 flex-row gap-3">
							<TouchableOpacity
								className="flex-1 rounded-xl border border-border bg-card px-4 py-3"
								onPress={resetFilters}
							>
								<Text className="text-center font-sans-medium text-foreground">
									Reinitialiser
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`flex-1 rounded-xl px-4 py-3 ${
									hasPendingChanges ? "bg-primary" : "bg-muted"
								}`}
								onPress={applyFiltersAndClose}
								disabled={!hasPendingChanges}
							>
								<Text className="text-center font-sans-medium text-primary-foreground">
									Appliquer
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</Container>
	);
}
