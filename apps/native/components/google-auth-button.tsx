import { Ionicons } from "@expo/vector-icons";
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
	mode: "sign-in" | "sign-up";
};

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const label =
		mode === "sign-in" ? "Se connecter avec Google" : "S’inscrire avec Google";

	const handlePress = async () => {
		setIsLoading(true);
		try {
			await authClient.signIn.social(
				{
					provider: "google",
					callbackURL: "/(tabs)/dashboard",
					errorCallbackURL: "/(tabs)/auth",
					newUserCallbackURL: "/(tabs)/dashboard",
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
			Alert.alert(
				"Google",
				"Nous n’avons pas réussi à établir la connexion avec Google. Vérifiez votre connexion internet ou réessayez dans quelques instants.",
			);
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
