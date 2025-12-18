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
				Create Account
			</Text>
			<form.Field name="name">
				{(field) => (
					<View className="mb-3">
						<TextInput
							className="rounded-md border border-input bg-input p-4 text-foreground"
							placeholder="Name"
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
							placeholder="Email"
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
							placeholder="Password"
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
					<Text className="font-medium text-primary-foreground">Sign Up</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}
