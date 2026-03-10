import { useAuth } from "@rythmons/auth/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Linking,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DevVerificationLinkResponse = {
	preview: {
		url: string;
		createdAt: string;
	} | null;
};

export default function VerifyEmailScreen() {
	const router = useRouter();
	const authClient = useAuth();
	const { data: session } = authClient.useSession();
	const params = useLocalSearchParams<{ email?: string | string[] }>();
	const insets = useSafeAreaInsets();
	const [isSending, setIsSending] = useState(false);
	const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(
		null,
	);
	const emailFromParams = Array.isArray(params.email)
		? params.email[0]
		: params.email;
	const targetEmail = session?.user?.email ?? emailFromParams;

	const loadDevVerificationLink = useCallback(async () => {
		if (!__DEV__ || !targetEmail || !process.env.EXPO_PUBLIC_SERVER_URL) {
			setDevVerificationUrl(null);
			return;
		}

		try {
			const response = await fetch(
				`${process.env.EXPO_PUBLIC_SERVER_URL}/api/dev/verification-link?email=${encodeURIComponent(targetEmail)}`,
			);

			if (!response.ok) {
				setDevVerificationUrl(null);
				return;
			}

			const data = (await response.json()) as DevVerificationLinkResponse;
			setDevVerificationUrl(data.preview?.url ?? null);
		} catch {
			setDevVerificationUrl(null);
		}
	}, [targetEmail]);

	useEffect(() => {
		void loadDevVerificationLink();
	}, [loadDevVerificationLink]);

	const handleResend = async () => {
		if (!targetEmail) {
			Alert.alert("Erreur", "Aucun e-mail associé à cette session.");
			return;
		}
		setIsSending(true);
		try {
			await authClient.sendVerificationEmail({
				email: targetEmail,
				callbackURL: "/",
			});
			await loadDevVerificationLink();
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

				{devVerificationUrl ? (
					<TouchableOpacity
						onPress={() => {
							Linking.openURL(devVerificationUrl).catch(() => {
								Alert.alert(
									"Erreur",
									"Impossible d'ouvrir le lien de vérification.",
								);
							});
						}}
						className="mt-2 w-full items-center justify-center rounded-md bg-primary p-4"
					>
						<Text className="font-medium text-primary-foreground">
							Ouvrir le lien de vérification (mode dev)
						</Text>
					</TouchableOpacity>
				) : null}

				<TouchableOpacity
					onPress={() => router.replace("/(tabs)/auth" as never)}
					className="mt-2 w-full items-center justify-center p-3"
				>
					<Text className="text-primary text-sm">Retour à la connexion</Text>
				</TouchableOpacity>

				<Text className="mt-4 text-center text-muted-foreground text-xs">
					Si vous ne trouvez pas l'e-mail, vérifiez votre dossier de spam.
				</Text>

				{devVerificationUrl ? (
					<Text className="text-center text-muted-foreground text-xs">
						En développement, ce bouton remplace l'ouverture d'un vrai e-mail
						pour tester la validation.
					</Text>
				) : null}
			</View>
		</View>
	);
}
