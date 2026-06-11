import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_STATE_KEY = "rythmons:native:search-state";

export type SearchTab = "venues" | "artists";

export type PersistedSearchState = {
	activeTab: SearchTab;
	viewMode: "list" | "map";
	currentPage: number;
	search: string;
	city: string;
	postalCode: string;
	selectedGenres: string[];
	selectedVenueType: string;
	budgetMin: string;
	budgetMax: string;
	feeMin: string;
	feeMax: string;
	radiusKm: number | null;
	userCoords: { lat: number; lng: number } | null;
};

const defaultState: PersistedSearchState = {
	activeTab: "venues",
	viewMode: "list",
	currentPage: 1,
	search: "",
	city: "",
	postalCode: "",
	selectedGenres: [],
	selectedVenueType: "",
	budgetMin: "",
	budgetMax: "",
	feeMin: "",
	feeMax: "",
	radiusKm: null,
	userCoords: null,
};

export async function getSearchState(): Promise<PersistedSearchState> {
	try {
		const raw = await AsyncStorage.getItem(SEARCH_STATE_KEY);
		if (!raw) return defaultState;
		const parsed = JSON.parse(raw) as Partial<PersistedSearchState>;
		return { ...defaultState, ...parsed };
	} catch {
		return defaultState;
	}
}

export async function setSearchState(
	state: PersistedSearchState,
): Promise<void> {
	try {
		await AsyncStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
	} catch {
		// Ignore storage failures
	}
}
