import { useSignUpForm } from "@rythmons/auth/client";
import {
	ActivityIndicator,
	Alert,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { queryClient } from "@/utils/trpc";
import { GoogleAuthButton } from "./google-auth-button";

export function SignUp({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
	const { form, isLoading } = useSignUpForm({
		onSuccess: () => {
			queryClient.refetchQueries();
		},
	});

	return (
		<View className="mt-6 rounded-lg border border-border bg-card p-4">
			<Text className="mb-4 font-semibold text-foreground text-lg">
				Créer un compte
			</Text>

			<View className="mb-4">
				<GoogleAuthButton action="sign-up" />
			</View>

			<View className="mb-4 flex-row items-center">
				<View className="h-px flex-1 bg-border" />
				<Text className="mx-2 text-muted-foreground text-xs uppercase">
					Ou s'inscrire avec
				</Text>
				<View className="h-px flex-1 bg-border" />
			</View>

			<form.Field name="name">
				{(field) => (
					<View className="mb-3">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Nom"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholderTextColor="#9CA3AF"
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

			<form.Field name="email">
				{(field) => (
					<View className="mb-3">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Adresse e-mail"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholderTextColor="#9CA3AF"
							keyboardType="email-address"
							autoCapitalize="none"
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
					<View className="mb-3">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Mot de passe"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholderTextColor="#9CA3AF"
							secureTextEntry
						/>
						{field.state.meta.errors.length > 0 && (
							<View className="mt-1">
								{field.state.meta.errors.map((err) => {
									const errorMessage =
										typeof err === "object"
											? (err as { message: string }).message
											: String(err);
									return (
										<Text
											key={errorMessage}
											className="text-destructive text-sm"
										>
											• {errorMessage}
										</Text>
									);
								})}
							</View>
						)}
					</View>
				)}
			</form.Field>

			<form.Field name="passwordConfirmation">
				{(field) => (
					<View className="mb-4">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Confirmation du mot de passe"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholderTextColor="#9CA3AF"
							secureTextEntry
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
				className="mb-2 flex-row items-center justify-center rounded-md bg-primary p-4"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="font-medium text-primary-foreground">
						Créer mon compte
					</Text>
				)}
			</TouchableOpacity>
			<TouchableOpacity onPress={onSwitchToSignIn} disabled={isLoading}>
				<Text className="text-center font-medium text-primary">
					Vous avez déjà un compte ? Connectez-vous
				</Text>
			</TouchableOpacity>
		</View>
	);
}
