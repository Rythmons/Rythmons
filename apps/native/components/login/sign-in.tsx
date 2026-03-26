import { useSignInForm } from "@rythmons/auth/client";
import { router } from "expo-router";
import { Alert, TouchableOpacity, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
	const { form, isLoading } = useSignInForm({
		onSuccess: async () => {
			void queryClient.refetchQueries();
			router.replace("/(drawer)/profile");
			Alert.alert("Succès", "Connexion réussie");
		},
		onError: (error) => {
			Alert.alert("Connexion impossible", error);
		},
	});

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
