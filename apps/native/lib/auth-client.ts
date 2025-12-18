import { expoClient } from "@better-auth/expo/client";
import { createClient } from "@rythmons/auth/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createClient({
	baseURL: process.env.EXPO_PUBLIC_SERVER_URL || "",
	plugins: [
		expoClient({
			scheme: "mybettertapp",
			storagePrefix: "Rythmons",
			storage: SecureStore,
		}),
	],
});
