import { useForgotPasswordForm } from "@rythmons/auth/client";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";

type Props = {
	onSwitchToSignUp: () => void;
	onSwitchToSignIn: () => void;
	onInputFocus?: (target: number | null) => void;
};

export function ForgotPassword({
	onSwitchToSignUp,
	onSwitchToSignIn,
	onInputFocus,
}: Props) {
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const { form, isLoading } = useForgotPasswordForm({
		onSuccess: () => {
			setError(null);
			setMessage(
				"Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
			);
		},
		onError: (errorMessage) => {
			setMessage(null);
			setError(errorMessage);
		},
	});

	return (
		<Card className="mt-4 p-5">
			<Title className="mb-1 text-foreground text-xl">
				Mot de passe oublie
			</Title>
			<Text className="mb-4 text-muted-foreground text-sm">
				On t'envoie un lien de reinitialisation par e-mail.
			</Text>
			<form.Field name="email">
				{(field) => (
					<Field
						label="Adresse email"
						error={
							field.state.meta.errors.length > 0
								? typeof field.state.meta.errors[0] === "object"
									? (field.state.meta.errors[0] as { message: string }).message
									: String(field.state.meta.errors[0])
								: error
						}
						className="mb-3"
					>
						<Input
							placeholder="Adresse email"
							value={field.state.value}
							onChangeText={(value) => {
								if (error) {
									setError(null);
								}
								if (message) {
									setMessage(null);
								}
								field.handleChange(value);
							}}
							onBlur={field.handleBlur}
							onFocus={(event) =>
								onInputFocus?.(event.nativeEvent.target ?? null)
							}
							placeholderTextColor="#9CA3AF"
							keyboardType="email-address"
							autoCapitalize="none"
						/>
					</Field>
				)}
			</form.Field>

			{message && <Text className="mb-2 text-sm text-success">{message}</Text>}

			<Button
				onPress={form.handleSubmit}
				disabled={isLoading}
				loading={isLoading}
				label="Envoyer le lien de reinitialisation"
			/>
			<View className="my-3 flex-row justify-center">
				<TouchableOpacity onPress={onSwitchToSignUp}>
					<Text className="text-primary text-sm">S'inscrire</Text>
				</TouchableOpacity>
				<Text> - </Text>
				<TouchableOpacity onPress={onSwitchToSignIn}>
					<Text className="text-primary text-sm">Se connecter</Text>
				</TouchableOpacity>
			</View>
		</Card>
	);
}
