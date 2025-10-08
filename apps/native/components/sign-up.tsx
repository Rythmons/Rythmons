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
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
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

export function SignUp({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

	const handleSignUp = async () => {
		const validation = schema.safeParse({ name, email, password });

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

		await authClient.signUp.email(
			{
				name,
				email,
				password,
			},
			{
				onError: (authError) => {
					setError(
						authError.error?.message ||
							"Impossible de créer votre compte pour le moment.",
					);
				},
				onSuccess: () => {
					setName("");
					setEmail("");
					setPassword("");
					Alert.alert("Inscription réussie", "Votre compte est prêt !");
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
				Créer un compte
			</Text>

			{error && (
				<View className="mb-4 rounded-md bg-destructive/10 p-3">
					<Text className="text-destructive text-sm">{error}</Text>
				</View>
			)}

			<TextInput
				className="mb-3 rounded-md border border-input bg-input p-4 text-foreground"
				placeholder="Nom complet"
				value={name}
				onChangeText={setName}
				placeholderTextColor="#9CA3AF"
			/>
			{fieldErrors.name ? (
				<Text className="mb-3 text-red-500 text-sm">{fieldErrors.name}</Text>
			) : null}

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
				onPress={handleSignUp}
				disabled={isLoading}
				className="mb-2 flex-row items-center justify-center rounded-md bg-primary p-4"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="font-medium text-primary-foreground">
						Créer mon compte
					</Text>
				)}
			</TouchableOpacity>
			<TouchableOpacity onPress={onSwitchToSignIn} disabled={isLoading}>
				<Text className="text-center font-medium text-primary">
					Vous avez déjà un compte ? Connectez-vous
				</Text>
			</TouchableOpacity>
		</View>
	);
}
