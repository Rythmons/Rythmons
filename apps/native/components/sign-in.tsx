import { useSignInForm } from "@rythmons/auth/client";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { queryClient } from "@/utils/trpc";

export function SignIn() {
	const { form, isLoading } = useSignInForm({
		onSuccess: () => {
			queryClient.refetchQueries();
		},
	});

	return (
		<View className="mt-6 rounded-lg border border-border bg-card p-4">
			<Text className="mb-4 font-semibold text-foreground text-lg">
				Se connecter
			</Text>
			<form.Field name="email">
				{(field) => (
					<View className="mb-3">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Adresse email"
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
					<View className="mb-4">
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
						Se connecter
					</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}
