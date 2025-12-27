import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export default function ProfileScreen() {
	const { data: session, isPending } = authClient.useSession();
	const [name, setName] = useState(session?.user?.name || "");
	const [isSaving, setIsSaving] = useState(false);

	// Update local state when session loads
	if (session?.user?.name && name === "" && name !== session.user.name) {
		setName(session.user.name);
	}

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Placeholder for update logic
			// await authClient.updateUser({ name });
			// await queryClient.invalidateQueries();
			setTimeout(() => {
				setIsSaving(false);
				Alert.alert("Succès", "Profil mis à jour !");
			}, 1000);
		} catch (_) {
			setIsSaving(false);
			Alert.alert("Erreur", "Erreur lors de la mise à jour");
		}
	};

	const handleLogout = async () => {
		await authClient.signOut();
		await queryClient.invalidateQueries();
		router.replace("/");
	};

	if (isPending) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
				</View>
			</Container>
		);
	}

	if (!session?.user) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center p-4">
					<Text className="mb-4 text-center text-foreground">
						Vous devez être connecté pour voir cette page.
					</Text>
					<TouchableOpacity
						className="rounded-lg bg-primary px-4 py-2"
						onPress={() => router.replace("/")}
					>
						<Text className="font-medium text-primary-foreground">
							Se connecter
						</Text>
					</TouchableOpacity>
				</View>
			</Container>
		);
	}

	return (
		<Container>
			<ScrollView className="flex-1 p-4">
				<Text className="mb-6 font-bold text-2xl text-foreground">
					Mon Profil
				</Text>

				<View className="mb-6 space-y-4">
					<View>
						<Text className="mb-1 font-medium text-foreground text-sm">
							Email
						</Text>
						<View className="rounded-lg border border-border bg-muted p-3">
							<Text className="text-muted-foreground">
								{session.user.email}
							</Text>
						</View>
						<Text className="mt-1 text-muted-foreground text-xs">
							L'email ne peut pas être modifié.
						</Text>
					</View>

					<View>
						<Text className="mb-1 font-medium text-foreground text-sm">
							Nom
						</Text>
						<TextInput
							className="rounded-lg border border-border bg-background p-3 text-foreground"
							value={name}
							onChangeText={setName}
							placeholder="Votre nom"
							placeholderTextColor="#666"
						/>
					</View>

					<TouchableOpacity
						className="mt-2 flex-row items-center justify-center rounded-lg bg-primary p-3"
						onPress={handleSave}
						disabled={isSaving}
					>
						{isSaving ? (
							<ActivityIndicator color="white" className="mr-2" />
						) : (
							<Ionicons
								name="save-outline"
								size={20}
								color="white"
								className="mr-2"
							/>
						)}
						<Text className="font-medium text-primary-foreground">
							{isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
						</Text>
					</TouchableOpacity>
				</View>

				<View className="mt-2 border-border border-t pt-6">
					<TouchableOpacity
						className="flex-row items-center justify-center rounded-lg bg-destructive p-3"
						onPress={handleLogout}
					>
						<Ionicons
							name="log-out-outline"
							size={20}
							color="white"
							className="mr-2"
						/>
						<Text className="font-medium text-white">Se déconnecter</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</Container>
	);
}
