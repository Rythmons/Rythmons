import { useSignInForm } from "@rythmons/auth/client";
import { router } from "expo-router";
import { Alert, TouchableOpacity, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNotice } from "@/components/ui/notice";
import { Text, Title } from "@/components/ui/typography";
import { queryClient } from "@/utils/trpc";
import { GoogleAuthButton } from "../google-auth-button";

type Props = {
	onSwitchToSignUp: () => void;
	onSwitchToForgotPassword: () => void;
	onInputFocus?: (target: number | null) => void;
};

export function SignIn({
	onSwitchToSignUp,
	onSwitchToForgotPassword,
	onInputFocus,
}: Props) {
	const { showNotice } = useNotice();
	const { form, isLoading } = useSignInForm({
		onSuccess: async () => {
			// Vide le cache (mémoire + disque) pour ne jamais montrer les
			// données d'un compte précédemment connecté sur cet appareil.
			queryClient.clear();
			router.replace("/(drawer)/profile");
			showNotice({
				title: "Connexion reussie",
				message: "Bienvenue sur votre espace Rythmons.",
				kind: "success",
			});
		},
		onError: (error) => {
			Alert.alert("Connexion impossible", error);
		},
	});

	const quickLogin = (email: string) => {
		form.setFieldValue("email", email);
		form.setFieldValue("password", "Rythmons123!");
		void form.handleSubmit();
	};

	return (
		<Card className="mt-6 p-5">
			<Title className="mb-1 text-foreground text-xl">Se connecter</Title>
			<Text className="mb-4 text-muted-foreground text-sm">
				Retrouve tes artistes, lieux et recommandations.
			</Text>

			<View className="mb-4">
				<GoogleAuthButton action="sign-in" />
			</View>

			<View className="mb-4 flex-row items-center">
				<View className="h-px flex-1 bg-border" />
				<Text className="mx-2 text-muted-foreground text-xs uppercase">
					Ou continuer avec
				</Text>
				<View className="h-px flex-1 bg-border" />
			</View>

			{process.env.EXPO_PUBLIC_E2E === "1" ? (
				<View className="mb-4 gap-2">
					<Text className="text-muted-foreground text-xs uppercase">
						Quick login (E2E)
					</Text>
					<View className="flex-row gap-2">
						<Button
							variant="secondary"
							className="flex-1"
							label="Demo Artiste"
							disabled={isLoading}
							onPress={() => quickLogin("demo.artist@rythmons.local")}
						/>
						<Button
							variant="secondary"
							className="flex-1"
							label="Demo Organisateur"
							disabled={isLoading}
							onPress={() => quickLogin("demo.organizer@rythmons.local")}
						/>
					</View>
				</View>
			) : null}

			<form.Field name="email">
				{(field) => (
					<Field
						label="Adresse email"
						error={
							field.state.meta.errors.length > 0
								? typeof field.state.meta.errors[0] === "object"
									? (field.state.meta.errors[0] as { message: string }).message
									: String(field.state.meta.errors[0])
								: undefined
						}
						className="mb-3"
					>
						<Input
							placeholder="nom@domaine.com"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							onFocus={(event) =>
								onInputFocus?.(event.nativeEvent.target ?? null)
							}
							placeholderTextColor="#9CA3AF"
							keyboardType="email-address"
							autoCapitalize="none"
							textContentType="emailAddress"
							autoComplete="email"
						/>
					</Field>
				)}
			</form.Field>
			<form.Field name="password">
				{(field) => (
					<Field
						label="Mot de passe"
						error={
							field.state.meta.errors.length > 0
								? typeof field.state.meta.errors[0] === "object"
									? (field.state.meta.errors[0] as { message: string }).message
									: String(field.state.meta.errors[0])
								: undefined
						}
						className="mb-4"
					>
						<Input
							placeholder="Mot de passe"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							onFocus={(event) =>
								onInputFocus?.(event.nativeEvent.target ?? null)
							}
							placeholderTextColor="#9CA3AF"
							secureTextEntry
							textContentType="password"
							autoComplete="password"
						/>
					</Field>
				)}
			</form.Field>
			<Button
				onPress={form.handleSubmit}
				disabled={isLoading}
				loading={isLoading}
				label="Se connecter"
			/>
			<View className="mt-4 gap-3">
				<TouchableOpacity onPress={onSwitchToForgotPassword}>
					<Text className="text-center text-primary text-sm">
						Mot de passe oublié ?
					</Text>
				</TouchableOpacity>

				<View className="flex-row justify-center">
					<Text className="text-muted-foreground text-sm">
						Pas encore de compte ?{" "}
					</Text>
					<TouchableOpacity onPress={onSwitchToSignUp}>
						<Text className="text-primary text-sm">Créer un compte</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Card>
	);
}
