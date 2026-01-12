import { useSignUpForm } from "@rythmons/auth/client";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { queryClient } from "@/utils/trpc";
import { Input } from "./ui/input";
import { Text } from "./ui/typography";

export function SignUp() {
	const { form, isLoading, error } = useSignUpForm({
		onSuccess: () => {
			queryClient.refetchQueries();
		},
	});

	return (
		<View className="mt-6 rounded-lg border border-border bg-card p-4">
			<Text className="mb-4 font-sans-bold text-lg">Créer un compte</Text>

			{error && (
				<View className="mb-4 rounded-md bg-destructive/10 p-3">
					<Text className="text-destructive text-sm">{error}</Text>
				</View>
			)}

			<form.Field name="name">
				{(field) => {
					const firstError = field.state.meta.errors[0];
					const errorMessage =
						typeof firstError === "object" && firstError?.message
							? firstError.message
							: String(firstError);

					return (
						<View className="mb-3">
							<Input
								className="rounded-md border border-input bg-input p-4 text-foreground"
								placeholder="Nom"
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								placeholderTextColor="#9CA3AF"
							/>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<Text className="mt-1 text-destructive text-sm">
										{errorMessage}
									</Text>
								)}
						</View>
					);
				}}
			</form.Field>
			<form.Field name="email">
				{(field) => {
					const firstError = field.state.meta.errors[0];
					const errorMessage =
						typeof firstError === "object" && firstError?.message
							? firstError.message
							: String(firstError);

					return (
						<View className="mb-3">
							<Input
								className="rounded-md border border-input bg-input p-4 text-foreground"
								placeholder="Adresse email"
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								placeholderTextColor="#9CA3AF"
								keyboardType="email-address"
								autoCapitalize="none"
							/>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<Text className="mt-1 text-destructive text-sm">
										{errorMessage}
									</Text>
								)}
						</View>
					);
				}}
			</form.Field>
			<form.Field name="password">
				{(field) => {
					const firstError = field.state.meta.errors[0];
					const errorMessage =
						typeof firstError === "object" && firstError?.message
							? firstError.message
							: String(firstError);

					return (
						<View className="mb-4">
							<Input
								className="rounded-md border border-input bg-input p-4 text-foreground"
								placeholder="Mot de passe"
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								placeholderTextColor="#9CA3AF"
								secureTextEntry
							/>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<Text className="mt-1 text-destructive text-sm">
										{errorMessage}
									</Text>
								)}
						</View>
					);
				}}
			</form.Field>
			<TouchableOpacity
				onPress={form.handleSubmit}
				disabled={isLoading}
				className="flex-row items-center justify-center rounded-md bg-primary p-4"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="font-sans-medium text-primary-foreground">
						S'inscrire
					</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}
