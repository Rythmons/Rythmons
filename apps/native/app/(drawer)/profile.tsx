import { Ionicons } from "@expo/vector-icons";
import {
	type UserRole,
	userRoleLabels,
	userRoleValues,
} from "@rythmons/validation";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

export default function ProfileScreen() {
	const { data: session, isPending } = authClient.useSession();
	const [name, setName] = useState(session?.user?.name || "");
	const [role, setRole] = useState<UserRole | null>(
		session?.user?.role ?? null,
	);
	const [isSaving, setIsSaving] = useState(false);
	const updateRoleMutation = useMutation(
		trpc.account.updateRole.mutationOptions(),
	);

	useEffect(() => {
		if (!session?.user) return;
		setName(session.user.name || "");
		setRole(session.user.role ?? null);
	}, [session?.user]);

	const handleSave = async () => {
		if (!session?.user) return;
		const trimmedName = name.trim();
		const nameChanged = trimmedName !== session.user.name;
		const roleChanged = role !== (session.user.role ?? null);

		if (!nameChanged && !roleChanged) {
			Alert.alert("Info", "Aucune modification à enregistrer.");
			return;
		}

		if (trimmedName.length < 2) {
			Alert.alert("Erreur", "Le nom doit contenir au moins 2 caractères.");
			return;
		}

		setIsSaving(true);
		try {
			if (nameChanged) {
				await authClient.updateUser({
					name: trimmedName,
				});
			}

			if (roleChanged) {
				await updateRoleMutation.mutateAsync({
					role,
				});
			}

			await queryClient.invalidateQueries();
			Alert.alert("Succès", "Profil mis à jour !");
		} catch (_) {
			Alert.alert("Erreur", "Erreur lors de la mise à jour");
		} finally {
			setIsSaving(false);
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
						<Text className="font-sans-medium text-primary-foreground">
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
				<Title className="mb-6 text-2xl text-foreground">Mon Profil</Title>

				<View className="mb-6 space-y-4">
					<View>
						<Text className="mb-1 font-sans-medium text-foreground text-sm">
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
						<Text className="mb-1 font-sans-medium text-foreground text-sm">
							Nom
						</Text>
						<Input
							className="rounded-lg border border-border bg-background p-3 text-foreground"
							value={name}
							onChangeText={setName}
							placeholder="Votre nom"
							placeholderTextColor="#666"
						/>
					</View>

					<View>
						<Text className="mb-2 font-sans-medium text-foreground text-sm">
							Type de compte
						</Text>
						<View className="flex-row flex-wrap gap-2">
							<TouchableOpacity
								className={`rounded-full px-3 py-2 ${
									role === null
										? "bg-primary"
										: "border border-border bg-background"
								}`}
								onPress={() => setRole(null)}
							>
								<Text
									className={`text-sm ${
										role === null
											? "font-sans-medium text-primary-foreground"
											: "text-foreground"
									}`}
								>
									Plus tard
								</Text>
							</TouchableOpacity>
							{userRoleValues.map((userRole) => {
								const isSelected = role === userRole;
								return (
									<TouchableOpacity
										key={userRole}
										className={`rounded-full px-3 py-2 ${
											isSelected
												? "bg-primary"
												: "border border-border bg-background"
										}`}
										onPress={() => setRole(userRole)}
									>
										<Text
											className={`text-sm ${
												isSelected
													? "font-sans-medium text-primary-foreground"
													: "text-foreground"
											}`}
										>
											{userRoleLabels[userRole]}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
						<Text className="mt-2 text-muted-foreground text-xs">
							Les espaces Media / Radio et Prestataire restent en cours
							d'amélioration.
						</Text>
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
						<Text className="font-sans-medium text-primary-foreground">
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
						<Text className="font-sans-medium text-white">Se déconnecter</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</Container>
	);
}
