import { useAuth } from "@rythmons/auth/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
	const router = useRouter();
	const authClient = useAuth();
	const { data: session } = authClient.useSession();
	const insets = useSafeAreaInsets();
	const [isSending, setIsSending] = useState(false);

	const handleResend = async () => {
		if (!session?.user?.email) {
			Alert.alert("Erreur", "Aucun e-mail associé à cette session.");
			return;
		}
		setIsSending(true);
		try {
			await authClient.sendVerificationEmail({
				email: session.user.email,
				callbackURL: "/",
			});
			Alert.alert("Succès", "E-mail de vérification renvoyé !");
		} catch {
			Alert.alert("Erreur", "Échec de l'envoi. Réessayez plus tard.");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<View
			className="flex-1 items-center justify-center bg-background px-6"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<View className="w-full max-w-sm items-center gap-4">
				<View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
					<Text className="text-3xl">✉️</Text>
				</View>

				<Text className="text-center font-bold text-2xl text-foreground">
					Vérifiez votre e-mail
				</Text>

				<Text className="text-center text-base text-muted-foreground leading-relaxed">
					Un e-mail de vérification a été envoyé à votre adresse. Cliquez sur le
					lien dans l'e-mail pour activer votre compte.
				</Text>

				<TouchableOpacity
					onPress={handleResend}
					disabled={isSending}
					className="mt-4 w-full items-center justify-center rounded-md border border-border p-4"
				>
					{isSending ? (
						<ActivityIndicator size="small" />
					) : (
						<Text className="font-medium text-foreground">
							Renvoyer l'e-mail de vérification
						</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => router.replace("/(tabs)/auth" as never)}
					className="mt-2 w-full items-center justify-center p-3"
				>
					<Text className="text-primary text-sm">Retour à la connexion</Text>
				</TouchableOpacity>

				<Text className="mt-4 text-center text-muted-foreground text-xs">
					Si vous ne trouvez pas l'e-mail, vérifiez votre dossier de spam.
				</Text>
			</View>
		</View>
	);
}
