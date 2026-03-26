import { useSignInForm } from "@rythmons/auth/client";
import { router } from "expo-router";
import {
	ActivityIndicator,
	Alert,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { queryClient } from "@/utils/trpc";
import { GoogleAuthButton } from "../google-auth-button";

type Props = {
	onSwitchToSignUp: () => void;
	onSwitchToForgotPassword: () => void;
	onInputFocus?: () => void;
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
		<View className="mt-6 rounded-lg border border-border bg-card p-4">
			<Text className="mb-4 font-semibold text-foreground text-lg">
				Se connecter
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
					<View className="mb-3">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Adresse email"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							onFocus={onInputFocus}
							placeholderTextColor="#9CA3AF"
							keyboardType="email-address"
							autoCapitalize="none"
							textContentType="emailAddress"
							autoComplete="email"
						/>
						{field.state.meta.errors.length > 0 && (
							<Text className="mt-1 text-destructive text-sm">
								{typeof field.state.meta.errors[0] === "object"
									? (field.state.meta.errors[0] as { message: string }).message
									: String(field.state.meta.errors[0])}
							</Text>
						)}
					</View>
				)}
			</form.Field>
			<form.Field name="password">
				{(field) => (
					<View className="mb-4">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Mot de passe"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							onFocus={onInputFocus}
							placeholderTextColor="#9CA3AF"
							secureTextEntry
							textContentType="password"
							autoComplete="password"
						/>
						{field.state.meta.errors.length > 0 && (
							<Text className="mt-1 text-destructive text-sm">
								{typeof field.state.meta.errors[0] === "object"
									? (field.state.meta.errors[0] as { message: string }).message
									: String(field.state.meta.errors[0])}
							</Text>
						)}
					</View>
				)}
			</form.Field>
			<TouchableOpacity
				onPress={form.handleSubmit}
				disabled={isLoading}
				className="flex-row items-center justify-center rounded-md bg-primary p-4"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="font-medium text-primary-foreground">
						Se connecter
					</Text>
				)}
			</TouchableOpacity>
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
		</View>
	);
}
