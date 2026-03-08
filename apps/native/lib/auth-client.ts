import { expoClient } from "@better-auth/expo/client";
import { createClient } from "@rythmons/auth/client";
import * as SecureStore from "expo-secure-store";

const secureStoreAdapter = {
	getItem: (key: string) => {
		try {
			return SecureStore.getItem(key);
		} catch (_e) {
			console.warn(
				"SecureStore.getItem (sync) failed. Sync storage is not supported in this environment. Ensure your native app is rebuilt.",
			);
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

export const authClient = createClient({
	baseURL: process.env.EXPO_PUBLIC_SERVER_URL || "",
	plugins: [
		expoClient({
			scheme: "mybettertapp",
			storagePrefix: "Rythmons",
			storage: secureStoreAdapter,
		}),
	],
});
