import { useForgotPasswordForm } from "@rythmons/auth/client";
import { useState } from "react";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

type Props = {
	onSwitchToSignUp: () => void;
	onSwitchToSignIn: () => void;
};

export function ForgotPassword({ onSwitchToSignUp, onSwitchToSignIn }: Props) {
	const { form, isLoading } = useForgotPasswordForm({
		onSuccess: async () => {
			toast.success("Email de réinitialisation envoyé");
			queryClient.refetchQueries();
		},
	});
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit() {
		setLoading(true);
		setError(null);
		setMessage(null);

		try {
			await requestPasswordReset(email);
			setMessage(
				"Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
			);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<View className="mt-4 rounded-lg border border-border p-4">
			<Text className="mb-4 font-semibold text-foreground text-lg">
				Mot de passe oublié
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

						{error && (
							<Text className="mb-2 text-destructive text-sm">{error}</Text>
						)}
					</View>
				)}
			</form.Field>

			{message && (
				<Text className="mb-2 text-green-600 text-sm">{message}</Text>
			)}

			<TouchableOpacity
				onPress={form.handleSubmit}
				disabled={isLoading}
				className="flex-row items-center justify-center rounded-md bg-primary p-4"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="font-medium text-primary-foreground">
						Envoyer un email de réinitialisation
					</Text>
				)}
			</TouchableOpacity>
			<View className="my-3 flex-row justify-center">
				<TouchableOpacity onPress={onSwitchToSignUp}>
					<Text className="text-primary text-sm">S'inscrire</Text>
				</TouchableOpacity>
				<Text> - </Text>
				<TouchableOpacity onPress={onSwitchToSignIn}>
					<Text className="text-primary text-sm">Se connecter</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
