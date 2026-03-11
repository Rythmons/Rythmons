import { expoClient } from "@better-auth/expo/client";
import { createClient } from "@rythmons/auth/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/lib/api-base-url";

const secureStoreAdapter = {
	getItem: (key: string) => {
		try {
			return SecureStore.getItem(key);
		} catch (_e) {
			return null;
		}
	},
	setItem: (key: string, value: string) => {
		try {
			SecureStore.setItem(key, value);
		} catch (_e) {
			// Fallback to async if sync fails (fire and forget)
			SecureStore.setItemAsync(key, value).catch(console.error);
		}
	},
	removeItem: (key: string) => {
		SecureStore.deleteItemAsync(key).catch(console.error);
	},
};

const webStorageAdapter = {
	getItem: (key: string) => {
		if (typeof window === "undefined") {
			return null;
		}

		try {
			return window.localStorage.getItem(key);
		} catch (_error) {
			return null;
		}
	},
	setItem: (key: string, value: string) => {
		if (typeof window === "undefined") {
			return;
		}

		try {
			window.localStorage.setItem(key, value);
		} catch (_error) {
			// Ignore browser storage failures so auth can continue in degraded mode.
		}
	},
	removeItem: (key: string) => {
		if (typeof window === "undefined") {
			return;
		}

		try {
			window.localStorage.removeItem(key);
		} catch (_error) {
			// Ignore browser storage failures so auth can continue in degraded mode.
		}
	},
};

const authStorage =
	Platform.OS === "web" ? webStorageAdapter : secureStoreAdapter;

export const authClient = createClient({
	baseURL: getApiBaseUrl(),
	plugins: [
		expoClient({
			scheme: "mybettertapp",
			storagePrefix: "Rythmons",
			storage: authStorage,
		}),
	],
});
