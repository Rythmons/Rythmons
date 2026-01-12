import { useSignUpForm } from "@rythmons/auth/client";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { queryClient } from "@/utils/trpc";

export function SignUp() {
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
								{String(field.state.meta.errors[0])}
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
								{String(field.state.meta.errors[0])}
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
								{field.state.meta.errors.map((err) => (
									<Text key={String(err)} className="text-destructive text-sm">
										• {String(err)}
									</Text>
								))}
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
								{String(field.state.meta.errors[0])}
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
						S'inscrire
					</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}
