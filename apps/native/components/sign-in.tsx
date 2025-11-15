import { useAuth, useSignIn } from "@rythmons/auth/client";
import { useState } from "react";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { queryClient } from "@/utils/trpc";

export function SignIn() {
	const authClient = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { signIn, isLoading, error } = useSignIn(authClient);

	const handleLogin = async () => {
		await signIn(
			{ email, password },
			{
				onSuccess: () => {
					setEmail("");
					setPassword("");
					queryClient.refetchQueries();
				},
			},
		);
	};

	return (
		<View className="mt-6 rounded-lg border border-border bg-card p-4">
			<Text className="mb-4 font-semibold text-foreground text-lg">
				Sign In
			</Text>

			{error && (
				<View className="mb-4 rounded-md bg-destructive/10 p-3">
					<Text className="text-destructive text-sm">{error}</Text>
				</View>
			)}

			<TextInput
				className="mb-3 rounded-md border border-input bg-input p-4 text-foreground"
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				placeholderTextColor="#9CA3AF"
				keyboardType="email-address"
				autoCapitalize="none"
			/>

			<TextInput
				className="mb-4 rounded-md border border-input bg-input p-4 text-foreground"
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				placeholderTextColor="#9CA3AF"
				secureTextEntry
			/>

			<TouchableOpacity
				onPress={handleLogin}
				disabled={isLoading}
				className="flex-row items-center justify-center rounded-md bg-primary p-4"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="font-medium text-primary-foreground">Sign In</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}
