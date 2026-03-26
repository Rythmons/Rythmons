import { useSignUpForm } from "@rythmons/auth/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TouchableOpacity, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";
import { GoogleAuthButton } from "../google-auth-button";

type Props = {
	onSwitchToSignIn: () => void;
	onInputFocus?: (target: number | null) => void;
};

export function SignUp({ onSwitchToSignIn, onInputFocus }: Props) {
	const router = useRouter();
	const [emailValue, setEmailValue] = useState("");
	const { form, isLoading } = useSignUpForm({
		onSuccess: async () => {
			const verifyEmailHref = emailValue
				? `/verify-email?email=${encodeURIComponent(emailValue)}`
				: "/verify-email";
			router.push(verifyEmailHref as never);
		},
	});

	return (
		<Card className="mt-6 p-5">
			<Title className="mb-1 text-foreground text-xl">Créer un compte</Title>
			<Text className="mb-4 text-muted-foreground text-sm">
				Publie ton profil et commence a matcher.
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
					<Field
						label="Nom"
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
							placeholder="Nom"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							onFocus={(event) =>
								onInputFocus?.(event.nativeEvent.target ?? null)
							}
							placeholderTextColor="#9CA3AF"
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="email">
				{(field) => (
					<Field
						label="Adresse e-mail"
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
							placeholder="Adresse e-mail"
							value={field.state.value}
							onChangeText={(value) => {
								setEmailValue(value);
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

			<form.Field name="password">
				{(field) => (
					<Field
						label="Mot de passe"
						className="mb-3"
						error={
							field.state.meta.errors.length > 0
								? typeof field.state.meta.errors[0] === "object"
									? (field.state.meta.errors[0] as { message: string }).message
									: String(field.state.meta.errors[0])
								: undefined
						}
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
					</Field>
				)}
			</form.Field>

			<form.Field name="passwordConfirmation">
				{(field) => (
					<Field
						label="Confirmation"
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
							placeholder="Confirmation du mot de passe"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							onFocus={(event) =>
								onInputFocus?.(event.nativeEvent.target ?? null)
							}
							placeholderTextColor="#9CA3AF"
							secureTextEntry
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="acceptedTerms">
				{(field) => (
					<View className="mb-4">
						<Pressable
							onPress={() => field.handleChange(!field.state.value)}
							className="flex-row items-start gap-3"
						>
							<View
								className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
									field.state.value
										? "border-primary bg-primary"
										: "border-input bg-input"
								}`}
							>
								{field.state.value && (
									<Text className="font-bold text-primary-foreground text-xs">
										✓
									</Text>
								)}
							</View>
							<Text className="flex-1 text-foreground text-sm">
								J'accepte les{" "}
								<Text className="text-primary underline">
									conditions générales d'utilisation
								</Text>
							</Text>
						</Pressable>
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

			<Button
				onPress={form.handleSubmit}
				disabled={isLoading}
				loading={isLoading}
				label="S'inscrire"
			/>
			<View className="my-3 flex-row justify-center">
				<Text className="text-muted-foreground text-sm">Déjà inscrit ? </Text>
				<TouchableOpacity onPress={onSwitchToSignIn}>
					<Text className="text-primary text-sm">Connectez-vous</Text>
				</TouchableOpacity>
			</View>
		</Card>
	);
}
