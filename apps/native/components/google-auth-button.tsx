import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

type GoogleAuthButtonProps = {
	action: "sign-in" | "sign-up";
};

type AuthErrorPayload = {
	message?: string | null;
};

type AuthErrorWrapper = {
	error?: AuthErrorPayload | null;
};

const hasAuthKeyword = (error: unknown): boolean => {
	if (!error || typeof error !== "object") {
		return false;
	}
	if (!("error" in error)) {
		return false;
	}
	const payload = (error as AuthErrorWrapper).error;
	if (!payload || typeof payload !== "object") {
		return false;
	}
	const { message } = payload;
	if (typeof message !== "string") {
		return false;
	}
	return message.toLowerCase().includes("auth");
};

export function GoogleAuthButton({ action }: GoogleAuthButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const label =
		action === "sign-in"
			? "Se connecter avec Google"
			: "S’inscrire avec Google";

	const handlePress = async () => {
		setIsLoading(true);
		try {
			await authClient.signIn.social(
				{
					provider: "google",
					callbackURL: Linking.createURL("/(drawer)/(tabs)/dashboard"),
					errorCallbackURL: Linking.createURL("/"),
					newUserCallbackURL: Linking.createURL("/(drawer)/(tabs)/dashboard"),
				},
				{
					onError: (error) => {
						const message =
							error.error?.message ||
							error.error?.statusText ||
							"La connexion à Google a échoué. Merci de réessayer.";
						Alert.alert("Google", message);
						setIsLoading(false);
					},
					onSuccess: () => {
						queryClient.invalidateQueries();
					},
					onFinished: () => {
						setIsLoading(false);
					},
				},
			);
		} catch (_error) {
			let message = "Une erreur inconnue est survenue. Merci de réessayer.";
			if (_error instanceof TypeError && _error.message.includes("Network")) {
				message =
					"Problème de connexion internet. Vérifiez votre réseau et réessayez.";
			} else if (hasAuthKeyword(_error)) {
				message =
					"Erreur d’authentification. Veuillez vérifier vos identifiants Google.";
			} else {
				message =
					"Nous n’avons pas réussi à établir la connexion avec Google. Vérifiez votre connexion internet ou réessayez dans quelques instants.";
			}
			Alert.alert("Google", message);
			setIsLoading(false);
		}
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			disabled={isLoading}
			className="mb-4 flex-row items-center justify-center rounded-md border border-border bg-background px-4 py-3"
		>
			<View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-white">
				<Ionicons name="logo-google" size={18} color="#4285F4" />
			</View>
			{isLoading ? (
				<ActivityIndicator size="small" color="#1D4ED8" />
			) : (
				<Text className="font-medium text-foreground">{label}</Text>
			)}
		</TouchableOpacity>
	);
}
