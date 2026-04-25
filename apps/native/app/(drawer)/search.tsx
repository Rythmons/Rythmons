import { Ionicons } from "@expo/vector-icons";
import type { AppRouter } from "@rythmons/api";
import { MUSIC_GENRES, venueTypeValues } from "@rythmons/validation";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Image,
	Modal,
	RefreshControl,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button as TButton, XStack } from "tamagui";
import { Container } from "@/components/container";
import { Input } from "@/components/ui/input";
import { KeyboardFormScreen } from "@/components/ui/keyboard-form-screen";
import { SearchMap } from "@/components/ui/search-map";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import {
	getSearchState,
	type PersistedSearchState,
	setSearchState,
} from "@/lib/search-state-storage";
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
type AppliedFilterChip = {
	key: string;
	label: string;
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

export default function VenueSearchScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const scrollViewRef = useRef<{
		scrollTo?: (options: { y: number; animated?: boolean }) => void;
		scrollToPosition?: (x: number, y: number, animated?: boolean) => void;
	} | null>(null);
	const insets = useSafeAreaInsets();
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
	const [failedVenueLogoIds, setFailedVenueLogoIds] = useState<
		Record<string, boolean>
	>({});
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
		refetchOnMount: "always",
		refetchOnReconnect: true,
	});

	const venuesQuery = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user) && !hasOrganizerRole,
		refetchOnMount: "always",
		refetchOnReconnect: true,
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

	// Restore last search state from storage on mount
	const hasRestoredRef = useRef(false);
	useEffect(() => {
		if (!canUseSearch || hasRestoredRef.current) return;
		hasRestoredRef.current = true;
		getSearchState().then((s) => {
			const tab: SearchTab =
				s.activeTab === "artists" && canSearchArtists
					? "artists"
					: canSearchVenues
						? "venues"
						: canSearchArtists
							? "artists"
							: "venues";
			setActiveTab(tab);
			setViewMode(s.viewMode);
			setCurrentPage(s.currentPage);
			setSearch(s.search);
			setCity(s.city);
			setPostalCode(s.postalCode);
			setSelectedGenres(s.selectedGenres);
			setSelectedVenueType(s.selectedVenueType);
			setBudgetMin(s.budgetMin);
			setBudgetMax(s.budgetMax);
			setFeeMin(s.feeMin);
			setFeeMax(s.feeMax);
			setRadiusKm(s.radiusKm);
			setAppliedSearch(s.search);
			setAppliedCity(s.city);
			setAppliedPostalCode(s.postalCode);
			setAppliedGenres(s.selectedGenres);
			setAppliedVenueType(s.selectedVenueType);
			setAppliedBudgetMin(s.budgetMin);
			setAppliedBudgetMax(s.budgetMax);
			setAppliedFeeMin(s.feeMin);
			setAppliedFeeMax(s.feeMax);
			setAppliedRadiusKm(s.radiusKm);
			if (s.userCoords) {
				setUseMyLocation(true);
				setMyLocationCoords(s.userCoords);
				setLocationStatus("success");
				setAppliedUserCoords(s.userCoords);
			} else {
				setAppliedUserCoords(null);
			}
		});
	}, [canSearchArtists, canSearchVenues, canUseSearch]);

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
		refetchOnMount: "always",
		refetchOnReconnect: true,
	});

	const artistSearchQuery = useQuery({
		...trpc.artist.search.queryOptions(artistSearchInput),
		enabled:
			Boolean(session?.user) && canSearchArtists && activeTab === "artists",
		refetchOnMount: "always",
		refetchOnReconnect: true,
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
		if (scrollViewRef.current?.scrollToPosition) {
			scrollViewRef.current.scrollToPosition(0, 0, true);
			return;
		}
		scrollViewRef.current?.scrollTo?.({ y: 0, animated: true });
	}

	function scrollToTop() {
		if (scrollViewRef.current?.scrollToPosition) {
			scrollViewRef.current.scrollToPosition(0, 0, true);
			return;
		}
		scrollViewRef.current?.scrollTo?.({ y: 0, animated: true });
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
		const nextCoords =
			useMyLocation && myLocationCoords ? myLocationCoords : null;
		setAppliedSearch(normalizedQuery);
		setAppliedCity(city.trim());
		setAppliedPostalCode(postalCode.trim());
		setAppliedRadiusKm(radiusKm);
		setAppliedUserCoords(nextCoords);
		setAppliedGenres(selectedGenres);
		setAppliedVenueType(selectedVenueType);
		setAppliedBudgetMin(budgetMin);
		setAppliedBudgetMax(budgetMax);
		setAppliedFeeMin(feeMin);
		setAppliedFeeMax(feeMax);
		const state: PersistedSearchState = {
			activeTab,
			viewMode,
			currentPage: 1,
			search: normalizedQuery,
			city: city.trim(),
			postalCode: postalCode.trim(),
			selectedGenres,
			selectedVenueType,
			budgetMin,
			budgetMax,
			feeMin,
			feeMax,
			radiusKm,
			userCoords: nextCoords,
		};
		void setSearchState(state);
	}

	function applyFiltersAndClose() {
		applyFilters();
		setIsFilterModalOpen(false);
	}

	function persistAppliedState(next: {
		search: string;
		city: string;
		postalCode: string;
		radiusKm: number | null;
		userCoords: { lat: number; lng: number } | null;
		genres: string[];
		venueType: string;
		budgetMin: string;
		budgetMax: string;
		feeMin: string;
		feeMax: string;
	}) {
		const state: PersistedSearchState = {
			activeTab,
			viewMode,
			currentPage: 1,
			search: next.search,
			city: next.city,
			postalCode: next.postalCode,
			selectedGenres: next.genres,
			selectedVenueType: next.venueType,
			budgetMin: next.budgetMin,
			budgetMax: next.budgetMax,
			feeMin: next.feeMin,
			feeMax: next.feeMax,
			radiusKm: next.radiusKm,
			userCoords: next.userCoords,
		};
		void setSearchState(state);
	}

	function removeAppliedFilter(chipKey: string) {
		let nextSearch = appliedSearch;
		let nextCity = appliedCity;
		let nextPostalCode = appliedPostalCode;
		let nextRadiusKm = appliedRadiusKm;
		let nextUserCoords = appliedUserCoords;
		let nextGenres = [...appliedGenres];
		let nextVenueType = appliedVenueType;
		let nextBudgetMin = appliedBudgetMin;
		let nextBudgetMax = appliedBudgetMax;
		let nextFeeMin = appliedFeeMin;
		let nextFeeMax = appliedFeeMax;

		if (chipKey === "search") nextSearch = "";
		if (chipKey === "city") nextCity = "";
		if (chipKey === "postalCode") nextPostalCode = "";
		if (chipKey === "userCoords") nextUserCoords = null;
		if (chipKey === "radiusKm") nextRadiusKm = null;
		if (chipKey === "venueType") nextVenueType = "";
		if (chipKey === "budgetMin") nextBudgetMin = "";
		if (chipKey === "budgetMax") nextBudgetMax = "";
		if (chipKey === "feeMin") nextFeeMin = "";
		if (chipKey === "feeMax") nextFeeMax = "";
		if (chipKey.startsWith("genre:")) {
			const genreToRemove = chipKey.replace("genre:", "");
			nextGenres = nextGenres.filter(
				(genreName) => genreName !== genreToRemove,
			);
		}

		setCurrentPage(1);
		scrollToTop();
		setSearch(nextSearch);
		setCity(nextCity);
		setPostalCode(nextPostalCode);
		setRadiusKm(nextRadiusKm);
		setUseMyLocation(nextUserCoords != null);
		setMyLocationCoords(nextUserCoords);
		setLocationStatus(nextUserCoords != null ? "success" : "idle");
		setSelectedGenres(nextGenres);
		setSelectedVenueType(nextVenueType);
		setBudgetMin(nextBudgetMin);
		setBudgetMax(nextBudgetMax);
		setFeeMin(nextFeeMin);
		setFeeMax(nextFeeMax);
		setAppliedSearch(nextSearch);
		setAppliedCity(nextCity);
		setAppliedPostalCode(nextPostalCode);
		setAppliedRadiusKm(nextRadiusKm);
		setAppliedUserCoords(nextUserCoords);
		setAppliedGenres(nextGenres);
		setAppliedVenueType(nextVenueType);
		setAppliedBudgetMin(nextBudgetMin);
		setAppliedBudgetMax(nextBudgetMax);
		setAppliedFeeMin(nextFeeMin);
		setAppliedFeeMax(nextFeeMax);

		persistAppliedState({
			search: nextSearch,
			city: nextCity,
			postalCode: nextPostalCode,
			radiusKm: nextRadiusKm,
			userCoords: nextUserCoords,
			genres: nextGenres,
			venueType: nextVenueType,
			budgetMin: nextBudgetMin,
			budgetMax: nextBudgetMax,
			feeMin: nextFeeMin,
			feeMax: nextFeeMax,
		});
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

	const appliedFilterChips: AppliedFilterChip[] = [
		...(appliedSearch
			? [{ key: "search", label: `Recherche: ${appliedSearch}` }]
			: []),
		...(appliedCity ? [{ key: "city", label: `Ville: ${appliedCity}` }] : []),
		...(appliedPostalCode
			? [{ key: "postalCode", label: `CP: ${appliedPostalCode}` }]
			: []),
		...(appliedUserCoords != null
			? [{ key: "userCoords", label: "Ma position" }]
			: []),
		...(appliedRadiusKm != null
			? [{ key: "radiusKm", label: `Rayon: ${appliedRadiusKm} km` }]
			: []),
		...appliedGenres.map((genreName) => ({
			key: `genre:${genreName}`,
			label: genreName,
		})),
		...(activeTab === "venues"
			? [
					...(appliedVenueType
						? [
								{
									key: "venueType",
									label: getVenueTypeLabel(
										appliedVenueType as (typeof venueTypeValues)[number],
									),
								},
							]
						: []),
					...(appliedBudgetMin
						? [{ key: "budgetMin", label: `Budget min ${appliedBudgetMin}€` }]
						: []),
					...(appliedBudgetMax
						? [{ key: "budgetMax", label: `Budget max ${appliedBudgetMax}€` }]
						: []),
				]
			: [
					...(appliedFeeMin
						? [{ key: "feeMin", label: `Cachet min ${appliedFeeMin}€` }]
						: []),
					...(appliedFeeMax
						? [{ key: "feeMax", label: `Cachet max ${appliedFeeMax}€` }]
						: []),
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
						onPress={() => router.replace("/(drawer)/login")}
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

	return (
		<Container edges={["top", "left", "right"]}>
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
				<KeyboardFormScreen
					bottomInsetOffset={12 - insets.bottom}
					scrollRef={(ref) => {
						scrollViewRef.current = ref as typeof scrollViewRef.current;
					}}
					refreshControl={
						<RefreshControl
							refreshing={activeQuery.isFetching && !activeQuery.isLoading}
							onRefresh={() => void activeQuery.refetch()}
						/>
					}
				>
					{canSearchVenues && canSearchArtists ? (
						<XStack marginBottom="$4" gap="$2">
							<TButton
								unstyled
								flex={1}
								height={42}
								borderRadius="$4"
								backgroundColor={activeTab === "venues" ? "$color8" : "$color2"}
								borderWidth={activeTab === "venues" ? 0 : 1}
								borderColor="$borderColor"
								pressStyle={{ opacity: 0.9 }}
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
							</TButton>
							<TButton
								unstyled
								flex={1}
								height={42}
								borderRadius="$4"
								backgroundColor={
									activeTab === "artists" ? "$color8" : "$color2"
								}
								borderWidth={activeTab === "artists" ? 0 : 1}
								borderColor="$borderColor"
								pressStyle={{ opacity: 0.9 }}
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
							</TButton>
						</XStack>
					) : null}

					<View className="mb-4 gap-3">
						<View className="flex-row items-center gap-2">
							<View className="flex-1 flex-row items-center rounded-2xl border border-border bg-card px-4">
								<Ionicons name="search-outline" size={18} color="#b5a9c3" />
								<Input
									className="flex-1 border-0 bg-transparent px-2 py-3.5 text-base text-foreground"
									value={search}
									onChangeText={setSearch}
									onSubmitEditing={applyFilters}
									placeholder="Artiste, lieu ou ville"
									placeholderTextColor="#b5a9c3"
									autoCapitalize="none"
									autoCorrect={false}
									returnKeyType="search"
								/>
								{search.trim().length > 0 ? (
									<TouchableOpacity
										className="rounded-full bg-muted px-2 py-1.5"
										onPress={() => setSearch("")}
									>
										<Ionicons name="close" size={12} color="#d7cde2" />
									</TouchableOpacity>
								) : null}
							</View>
							<TouchableOpacity
								className="relative flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5"
								onPress={() => setIsFilterModalOpen(true)}
							>
								<Ionicons name="options-outline" size={16} color="#f5f1fa" />
								<Text className="font-sans-medium text-foreground text-sm">
									Filtres
								</Text>
								{activeFilterCount > 0 ? (
									<View className="absolute -top-1 -right-1 min-w-[18px] items-center rounded-full bg-primary px-1">
										<Text className="font-sans-bold text-[10px] text-primary-foreground">
											{activeFilterCount}
										</Text>
									</View>
								) : null}
							</TouchableOpacity>
						</View>

						{hasPendingChanges ? (
							<TouchableOpacity
								className="flex-row items-center justify-center rounded-xl bg-primary px-4 py-3"
								onPress={applyFilters}
							>
								<Text className="font-sans-medium text-primary-foreground">
									Mettre a jour les resultats
								</Text>
							</TouchableOpacity>
						) : null}

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 8, paddingRight: 4 }}
						>
							<TouchableOpacity
								className={`rounded-full border px-3 py-2 ${
									useMyLocation
										? "border-primary bg-primary"
										: "border-border bg-background"
								}`}
								onPress={() => void handleMyLocationToggle()}
							>
								<Text
									className={`font-sans-medium text-xs ${
										useMyLocation
											? "text-primary-foreground"
											: "text-foreground"
									}`}
								>
									Autour de moi
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`rounded-full border px-3 py-2 ${
									radiusKm === 25
										? "border-primary bg-primary"
										: "border-border bg-background"
								}`}
								onPress={() =>
									setRadiusKm((currentKm) => (currentKm === 25 ? null : 25))
								}
							>
								<Text
									className={`font-sans-medium text-xs ${
										radiusKm === 25
											? "text-primary-foreground"
											: "text-foreground"
									}`}
								>
									25 km
								</Text>
							</TouchableOpacity>
							{activeTab === "venues" ? (
								<TouchableOpacity
									className={`rounded-full border px-3 py-2 ${
										viewMode === "map"
											? "border-primary bg-primary"
											: "border-border bg-background"
									}`}
									onPress={() =>
										setViewMode((currentMode) =>
											currentMode === "map" ? "list" : "map",
										)
									}
								>
									<Text
										className={`font-sans-medium text-xs ${
											viewMode === "map"
												? "text-primary-foreground"
												: "text-foreground"
										}`}
									>
										Carte
									</Text>
								</TouchableOpacity>
							) : null}
							{activeTab === "venues" ? (
								<>
									<TouchableOpacity
										className={`rounded-full border px-3 py-2 ${
											selectedVenueType === "CLUB"
												? "border-primary bg-primary"
												: "border-border bg-background"
										}`}
										onPress={() =>
											setSelectedVenueType((currentType) =>
												currentType === "CLUB" ? "" : "CLUB",
											)
										}
									>
										<Text
											className={`font-sans-medium text-xs ${
												selectedVenueType === "CLUB"
													? "text-primary-foreground"
													: "text-foreground"
											}`}
										>
											Club
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										className={`rounded-full border px-3 py-2 ${
											selectedVenueType === "CAFE"
												? "border-primary bg-primary"
												: "border-border bg-background"
										}`}
										onPress={() =>
											setSelectedVenueType((currentType) =>
												currentType === "CAFE" ? "" : "CAFE",
											)
										}
									>
										<Text
											className={`font-sans-medium text-xs ${
												selectedVenueType === "CAFE"
													? "text-primary-foreground"
													: "text-foreground"
											}`}
										>
											Cafe
										</Text>
									</TouchableOpacity>
								</>
							) : (
								<TouchableOpacity
									className={`rounded-full border px-3 py-2 ${
										feeMax.trim().length > 0
											? "border-primary bg-primary"
											: "border-border bg-background"
									}`}
									onPress={() =>
										setFeeMax((currentFeeMax) => (currentFeeMax ? "" : "600"))
									}
								>
									<Text
										className={`font-sans-medium text-xs ${
											feeMax.trim().length > 0
												? "text-primary-foreground"
												: "text-foreground"
										}`}
									>
										Cachet max 600 €
									</Text>
								</TouchableOpacity>
							)}
						</ScrollView>

						{hasAdvancedFilters || appliedFilterChips.length > 0 ? (
							<View className="mt-2 flex-row items-center justify-between">
								<Text className="text-muted-foreground text-xs">
									{activeFilterCount} filtre(s) actif(s)
								</Text>
								<TouchableOpacity onPress={resetFilters}>
									<Text className="font-sans-medium text-primary text-xs">
										Reinitialiser
									</Text>
								</TouchableOpacity>
							</View>
						) : null}

						{appliedFilterChips.length > 0 ? (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{
									gap: 8,
									paddingTop: 10,
									paddingRight: 4,
								}}
							>
								{appliedFilterChips.map((chip) => (
									<TouchableOpacity
										key={chip.key}
										className="flex-row items-center gap-1 rounded-full border border-border bg-background px-3 py-2"
										onPress={() => removeAppliedFilter(chip.key)}
									>
										<Text className="text-foreground text-xs">
											{chip.label}
										</Text>
										<Ionicons name="close" size={12} color="#9ca3af" />
									</TouchableOpacity>
								))}
							</ScrollView>
						) : null}
					</View>

					<View className="mb-3 flex-row items-center justify-between">
						<Text className="text-muted-foreground text-sm">
							{appliedSearch
								? `${activeItems.length} resultat(s) pour "${appliedSearch}"`
								: activeTab === "venues"
									? `${activeItems.length} lieu(x) disponible(s)`
									: `${activeItems.length} artiste(s) disponible(s)`}
						</Text>
						{activeQuery.isFetching && !activeQuery.isLoading ? (
							<Text className="text-muted-foreground text-xs">
								Mise a jour...
							</Text>
						) : null}
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
							<TouchableOpacity
								className="mt-3 self-start rounded-lg bg-primary px-4 py-2"
								onPress={() => void activeQuery.refetch()}
							>
								<Text className="font-sans-medium text-primary-foreground">
									Reessayer
								</Text>
							</TouchableOpacity>
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
										const topGenres = venue.genres
											.slice(0, 3)
											.map((genre) => genre.name);
										const hasVenueHeroImage = Boolean(venue.photoUrl);

										return (
											<TouchableOpacity
												key={venue.id}
												className="overflow-hidden rounded-2xl border border-border bg-card"
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
												<View className="relative">
													{hasVenueHeroImage ? (
														<Image
															source={{ uri: venue.photoUrl ?? undefined }}
															className="h-40 w-full"
															resizeMode="cover"
														/>
													) : (
														<View className="h-28 w-full items-center justify-center bg-muted">
															<View className="items-center gap-2">
																<View className="rounded-full bg-background/80 p-3">
																	<Ionicons
																		name="business-outline"
																		size={28}
																		color="#a78bfa"
																	/>
																</View>
																<Text className="font-sans-medium text-foreground text-sm">
																	Visuel a venir
																</Text>
															</View>
														</View>
													)}
													{hasVenueHeroImage ? (
														<View className="absolute inset-0 bg-black/20" />
													) : null}
													<View className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1">
														<Text className="font-sans-medium text-foreground text-xs">
															{getVenueTypeLabel(venue.venueType)}
														</Text>
													</View>
													<View className="absolute right-3 bottom-3 rounded-full bg-background/90 px-3 py-1">
														<Text className="font-sans-medium text-foreground text-xs">
															{venue.city}
														</Text>
													</View>
												</View>

												<View className="p-4">
													<View className="flex-row items-start gap-3">
														{venue.logoUrl && !failedVenueLogoIds[venue.id] ? (
															<Image
																source={{ uri: venue.logoUrl }}
																className="-mt-8 h-14 w-14 rounded-xl border-2 border-background"
																onError={() =>
																	setFailedVenueLogoIds((currentState) => ({
																		...currentState,
																		[venue.id]: true,
																	}))
																}
															/>
														) : (
															<View className="-mt-8 h-14 w-14 items-center justify-center rounded-xl border-2 border-background bg-primary/10">
																<Ionicons
																	name="business-outline"
																	size={24}
																	color="#7c3aed"
																/>
															</View>
														)}

														<View className="flex-1">
															<Title className="text-foreground text-xl">
																{venue.name}
															</Title>
															<Text className="text-muted-foreground text-xs">
																Organisateur: {venue.owner.name}
															</Text>
														</View>

														<Ionicons
															name="chevron-forward"
															size={20}
															color="#9ca3af"
														/>
													</View>

													{topGenres.length > 0 ? (
														<View className="mt-3 flex-row flex-wrap gap-2">
															{topGenres.map((genreName) => (
																<View
																	key={`${venue.id}-${genreName}`}
																	className="rounded-full border border-border bg-background px-2.5 py-1"
																>
																	<Text className="text-foreground text-xs">
																		{genreName}
																	</Text>
																</View>
															))}
														</View>
													) : (
														<Text className="mt-3 text-muted-foreground text-xs">
															{genreLabel}
														</Text>
													)}

													<Text
														className="mt-3 text-muted-foreground text-sm"
														numberOfLines={2}
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
										const topGenres = artist.genres
											.slice(0, 3)
											.map((genre) => genre.name);
										const hasArtistHeroImage = Boolean(
											artist.bannerUrl || artist.photoUrl,
										);

										return (
											<TouchableOpacity
												key={artist.id}
												className="overflow-hidden rounded-2xl border border-border bg-card"
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
												<View className="relative">
													{hasArtistHeroImage ? (
														<Image
															source={{
																uri:
																	artist.bannerUrl ||
																	artist.photoUrl ||
																	undefined,
															}}
															className="h-40 w-full"
															resizeMode="cover"
														/>
													) : (
														<View className="h-28 w-full items-center justify-center bg-muted">
															<View className="items-center gap-2">
																<View className="rounded-full bg-background/80 p-3">
																	<Ionicons
																		name="musical-notes-outline"
																		size={28}
																		color="#a78bfa"
																	/>
																</View>
																<Text className="font-sans-medium text-foreground text-sm">
																	Visuel a venir
																</Text>
															</View>
														</View>
													)}
													{hasArtistHeroImage ? (
														<View className="absolute inset-0 bg-black/25" />
													) : null}
													<View className="absolute right-3 bottom-3 rounded-full bg-background/90 px-3 py-1">
														<Text className="font-sans-medium text-foreground text-xs">
															{formatRangeLabel(artist.feeMin, artist.feeMax)}
														</Text>
													</View>
												</View>

												<View className="p-4">
													<View className="flex-row items-start gap-3">
														{artist.photoUrl ? (
															<Image
																source={{ uri: artist.photoUrl }}
																className="-mt-8 h-16 w-16 rounded-full border-2 border-background"
															/>
														) : (
															<View className="-mt-8 h-16 w-16 items-center justify-center rounded-full border-2 border-background bg-primary/10">
																<Ionicons
																	name="musical-notes-outline"
																	size={26}
																	color="#7c3aed"
																/>
															</View>
														)}

														<View className="flex-1">
															<Title className="text-foreground text-xl">
																{artist.stageName}
															</Title>
															<Text className="text-muted-foreground text-xs">
																{artist.city || "Localisation non renseignee"}
															</Text>
														</View>
														<Ionicons
															name="chevron-forward"
															size={20}
															color="#9ca3af"
														/>
													</View>

													{topGenres.length > 0 ? (
														<View className="mt-3 flex-row flex-wrap gap-2">
															{topGenres.map((genreName) => (
																<View
																	key={`${artist.id}-${genreName}`}
																	className="rounded-full border border-border bg-background px-2.5 py-1"
																>
																	<Text className="text-foreground text-xs">
																		{genreName}
																	</Text>
																</View>
															))}
														</View>
													) : (
														<Text className="mt-3 text-muted-foreground text-xs">
															{genreLabel}
														</Text>
													)}

													<Text
														className="mt-3 text-muted-foreground text-sm"
														numberOfLines={2}
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
						<View className="mt-5 flex-row items-center justify-between border-border border-t pt-4">
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
									Precedent
								</Text>
							</TouchableOpacity>
							<Text className="text-muted-foreground text-sm">
								Page {safePage}/{totalPages}
							</Text>
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
									Suivant
								</Text>
							</TouchableOpacity>
						</View>
					) : null}
				</KeyboardFormScreen>
			)}

			<Modal
				animationType="slide"
				transparent
				visible={isFilterModalOpen}
				onRequestClose={() => setIsFilterModalOpen(false)}
			>
				<View className="flex-1 justify-end">
					<TouchableOpacity
						activeOpacity={1}
						className="h-[12%] bg-black/50"
						onPress={() => setIsFilterModalOpen(false)}
					/>
					<View className="h-[88%] rounded-t-3xl border border-border bg-background px-4 pt-4 pb-6">
						<View className="mb-3 items-center">
							<View className="h-1.5 w-12 rounded-full bg-border" />
						</View>
						<View className="mb-4">
							<Title className="text-foreground text-xl">Filtres</Title>
							<Text className="mt-1 text-muted-foreground text-sm">
								{activeTab === "venues"
									? "Affinez les lieux sans quitter les resultats."
									: "Affinez les artistes sans quitter les resultats."}
							</Text>
						</View>

						<ScrollView
							className="flex-1"
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
							keyboardDismissMode="interactive"
							contentInsetAdjustmentBehavior="never"
							contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
						>
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
