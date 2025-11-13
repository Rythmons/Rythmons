import { useState } from "react";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export function SignUp() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<{
		name?: string;
		email?: string;
		password?: string[];
		passwordConfirmation?: string;
	}>({});

	const validatePassword = (pwd: string): string[] => {
		const errors: string[] = [];
		if (pwd.length < 8) {
			errors.push("Le mot de passe doit contenir au moins 8 caractères");
		}
		if (!/[A-Z]/.test(pwd)) {
			errors.push("Le mot de passe doit contenir au moins une majuscule");
		}
		if (!/[a-z]/.test(pwd)) {
			errors.push("Le mot de passe doit contenir au moins une minuscule");
		}
		if (!/[0-9]/.test(pwd)) {
			errors.push("Le mot de passe doit contenir au moins un chiffre");
		}
		if (!/[^A-Za-z0-9]/.test(pwd)) {
			errors.push(
				"Le mot de passe doit contenir au moins un caractère spécial",
			);
		}
		return errors;
	};

	const validateForm = (): boolean => {
		const errors: typeof validationErrors = {};
		let isValid = true;

		// Validate name
		if (name.length < 2) {
			errors.name = "Le nom doit contenir au moins 2 caractères";
			isValid = false;
		}

		// Validate email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			errors.email = "Adresse e-mail invalide";
			isValid = false;
		}

		// Validate password
		const passwordErrors = validatePassword(password);
		if (passwordErrors.length > 0) {
			errors.password = passwordErrors;
			isValid = false;
		}

		// Validate password confirmation
		if (password !== passwordConfirmation) {
			errors.passwordConfirmation = "Les mots de passe ne correspondent pas";
			isValid = false;
		}

		setValidationErrors(errors);
		return isValid;
	};

	const handleSignUp = async () => {
		setError(null);
		setValidationErrors({});

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		await authClient.signUp.email(
			{
				name,
				email,
				password,
			},
			{
				onError: (error) => {
					setError(error.error?.message || "Failed to sign up");
					setIsLoading(false);
				},
				onSuccess: () => {
					setName("");
					setEmail("");
					setPassword("");
					setPasswordConfirmation("");
					queryClient.refetchQueries();
				},
				onFinished: () => {
					setIsLoading(false);
				},
			},
		);
	};

	return (
		<View className="mt-6 rounded-lg border border-border bg-card p-4">
			<Text className="mb-4 font-semibold text-foreground text-lg">
				Créer un compte
			</Text>

			{error && (
				<View className="mb-4 rounded-md bg-destructive/10 p-3">
					<Text className="text-destructive text-sm">{error}</Text>
				</View>
			)}

			<View className="mb-3">
				<TextInput
					className="rounded-md border border-input bg-input p-4 text-foreground"
					placeholder="Nom"
					value={name}
					onChangeText={setName}
					placeholderTextColor="#9CA3AF"
				/>
				{validationErrors.name && (
					<Text className="mt-1 text-destructive text-sm">
						{validationErrors.name}
					</Text>
				)}
			</View>

			<View className="mb-3">
				<TextInput
					className="rounded-md border border-input bg-input p-4 text-foreground"
					placeholder="E-mail"
					value={email}
					onChangeText={setEmail}
					placeholderTextColor="#9CA3AF"
					keyboardType="email-address"
					autoCapitalize="none"
				/>
				{validationErrors.email && (
					<Text className="mt-1 text-destructive text-sm">
						{validationErrors.email}
					</Text>
				)}
			</View>

			<View className="mb-3">
				<TextInput
					className="rounded-md border border-input bg-input p-4 text-foreground"
					placeholder="Mot de passe"
					value={password}
					onChangeText={setPassword}
					placeholderTextColor="#9CA3AF"
					secureTextEntry
				/>
				{validationErrors.password && validationErrors.password.length > 0 && (
					<View className="mt-1">
						{validationErrors.password.map((err) => (
							<Text key={err} className="text-destructive text-sm">
								• {err}
							</Text>
						))}
					</View>
				)}
			</View>

			<View className="mb-4">
				<TextInput
					className="rounded-md border border-input bg-input p-4 text-foreground"
					placeholder="Confirmation du mot de passe"
					value={passwordConfirmation}
					onChangeText={setPasswordConfirmation}
					placeholderTextColor="#9CA3AF"
					secureTextEntry
				/>
				{validationErrors.passwordConfirmation && (
					<Text className="mt-1 text-destructive text-sm">
						{validationErrors.passwordConfirmation}
					</Text>
				)}
			</View>

			<TouchableOpacity
				onPress={handleSignUp}
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
