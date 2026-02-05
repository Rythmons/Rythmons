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

export async function requestPasswordReset(email: string) {
	const res = await fetch(
		`${process.env.EXPO_PUBLIC_SERVER_URL}/api/forgotten-password`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		},
	);

	const data = await res.json();

	if (!res.ok) {
		throw new Error(data.error || "Erreur lors de la demande");
	}

	return data;
}
