import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

const schema = z.object({
	email: z
		.string()
		.min(1, "L’adresse e-mail est obligatoire")
		.email("Adresse e-mail invalide"),
	password: z
		.string()
		.min(1, "Le mot de passe est obligatoire")
		.min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

type SchemaFields = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof SchemaFields, string>>;

export function SignIn({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

	const handleLogin = async () => {
		const validation = schema.safeParse({ email, password });

		if (!validation.success) {
			const validationErrors: FormErrors = {};
			for (const issue of validation.error.issues) {
				if (issue.path[0]) {
					validationErrors[issue.path[0] as keyof SchemaFields] = issue.message;
				}
			}
			setFieldErrors(validationErrors);
			return;
		}

		setFieldErrors({});
		setIsLoading(true);
		setError(null);

		await authClient.signIn.email(
			{
				email,
				password,
			},
			{
				onError: (authError) => {
					setError(
						authError.error?.message ||
							"Impossible de vous connecter. Vérifiez vos identifiants.",
					);
				},
				onSuccess: () => {
					setEmail("");
					setPassword("");
					Alert.alert("Connexion réussie", "Bienvenue sur Rythmons !");
					queryClient.refetchQueries();
				},
				onFinished: () => {
					setIsLoading(false);
				},
			},
		);
	};

	return (
		<View className="rounded-lg border border-border bg-card p-4">
			<Text className="mb-4 font-semibold text-foreground text-xl">
				Se connecter
			</Text>

			{error && (
				<View className="mb-4 rounded-md bg-destructive/10 p-3">
					<Text className="text-destructive text-sm">{error}</Text>
				</View>
			)}

			<TextInput
				className="mb-3 rounded-md border border-input bg-input p-4 text-foreground"
				placeholder="Adresse e-mail"
				value={email}
				onChangeText={setEmail}
				placeholderTextColor="#9CA3AF"
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			{fieldErrors.email ? (
				<Text className="mb-3 text-red-500 text-sm">{fieldErrors.email}</Text>
			) : null}

			<TextInput
				className="mb-4 rounded-md border border-input bg-input p-4 text-foreground"
				placeholder="Mot de passe"
				value={password}
				onChangeText={setPassword}
				placeholderTextColor="#9CA3AF"
				secureTextEntry
			/>
			{fieldErrors.password ? (
				<Text className="mb-3 text-red-500 text-sm">
					{fieldErrors.password}
				</Text>
			) : null}

			<TouchableOpacity
				onPress={handleLogin}
				disabled={isLoading}
				className="mb-2 flex-row items-center justify-center rounded-md bg-primary p-4"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="font-medium text-primary-foreground">Connexion</Text>
				)}
			</TouchableOpacity>
			<TouchableOpacity onPress={onSwitchToSignUp} disabled={isLoading}>
				<Text className="text-center font-medium text-primary">
					Besoin d’un compte ? Inscrivez-vous
				</Text>
			</TouchableOpacity>
		</View>
	);
}
