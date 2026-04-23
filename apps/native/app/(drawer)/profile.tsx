import { Ionicons } from "@expo/vector-icons";
import {
	type UserRole,
	userRoleLabels,
	userRoleValues,
} from "@rythmons/validation";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KeyboardFormScreen } from "@/components/ui/keyboard-form-screen";
import { useNotice } from "@/components/ui/notice";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

const ROLE_DESCRIPTIONS: Record<UserRole | "LATER", string> = {
	LATER: "Je veux surtout explorer l'app avant de choisir un usage principal.",
	ARTIST:
		"Je joue en live, je cherche des lieux et je recois des propositions.",
	ORGANIZER:
		"Je programme un lieu, je cherche des artistes et je gere des bookings.",
	MEDIA:
		"Je couvre la scene, je partage des selections et des contenus editoriaux.",
	TECH_SERVICE:
		"J'accompagne les evenements avec de la technique, du son ou de la lumiere.",
	BOTH: "J'ai un double usage artiste et organisateur dans la meme app.",
};

const UPCOMING_ROLES = new Set<UserRole>(["MEDIA", "TECH_SERVICE"]);

export default function ProfileScreen() {
	const { showNotice } = useNotice();
	const { data: session, isPending } = authClient.useSession();
	const sessionRole = (session?.user as { role?: UserRole | null } | undefined)
		?.role;
	const [name, setName] = useState(session?.user?.name || "");
	const [role, setRole] = useState<UserRole | null>(sessionRole ?? null);
	const [isSaving, setIsSaving] = useState(false);
	const updateRoleMutation = useMutation(
		trpc.account.updateRole.mutationOptions(),
	);

	useEffect(() => {
		if (!session?.user) return;
		setName(session.user.name || "");
		setRole(sessionRole ?? null);
	}, [session?.user, sessionRole]);

	const handleSave = async () => {
		if (!session?.user) return;
		const trimmedName = name.trim();
		const nameChanged = trimmedName !== session.user.name;
		const roleChanged = role !== (sessionRole ?? null);

		if (!nameChanged && !roleChanged) {
			showNotice({
				title: "Aucune modification",
				message: "Votre profil est deja a jour.",
				kind: "info",
			});
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
			showNotice({
				title: "Profil mis a jour",
				message: "Vos modifications sont enregistrees.",
				kind: "success",
			});
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

	const handleLogoutPress = () => {
		Alert.alert(
			"Se deconnecter ?",
			"Vous pourrez vous reconnecter a tout moment depuis l'accueil.",
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Se deconnecter",
					style: "destructive",
					onPress: () => void handleLogout(),
				},
			],
		);
	};

	const roleOptions = useMemo(
		() => [
			{
				value: null,
				label: "Plus tard",
				description: ROLE_DESCRIPTIONS.LATER,
				isUpcoming: false,
			},
			...userRoleValues.map((userRole) => ({
				value: userRole,
				label: userRoleLabels[userRole],
				description: ROLE_DESCRIPTIONS[userRole],
				isUpcoming: UPCOMING_ROLES.has(userRole),
			})),
		],
		[],
	);
	const currentRoleLabel = role == null ? "Plus tard" : userRoleLabels[role];
	const orderedRoleOptions = useMemo(
		() => [
			...roleOptions.filter((option) => option.value === role),
			...roleOptions.filter((option) => option.value !== role),
		],
		[role, roleOptions],
	);

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
			<KeyboardFormScreen>
				<View className="mb-6 gap-2">
					<Text className="font-sans-medium text-primary text-sm">Compte</Text>
					<Title className="text-3xl text-foreground">Mon profil</Title>
					<Text className="text-base text-muted-foreground leading-6">
						Modifiez vos informations et choisissez le role qui correspond le
						mieux a votre usage de Rythmons.
					</Text>
				</View>

				<Card className="mb-4">
					<Title className="text-foreground text-xl">Identite</Title>
					<Text className="mt-1 text-muted-foreground text-sm leading-6">
						Ces informations apparaissent dans vos interactions et vos fiches.
					</Text>

					<View className="mt-5 gap-4">
						<View className="gap-2">
							<Text className="font-sans-medium text-foreground text-sm">
								Email
							</Text>
							<View className="rounded-xl border border-border bg-input px-4 py-3">
								<Text className="text-base text-foreground">
									{session.user.email}
								</Text>
							</View>
							<Text className="text-muted-foreground text-xs leading-5">
								L&apos;email est gere par votre compte et ne peut pas etre
								modifie ici.
							</Text>
						</View>

						<View className="gap-2">
							<Text className="font-sans-medium text-foreground text-sm">
								Nom affiche
							</Text>
							<Input
								value={name}
								onChangeText={setName}
								placeholder="Votre nom ou nom de structure"
								placeholderTextColor="#b5a9c3"
							/>
						</View>
					</View>
				</Card>

				<Card className="mb-4">
					<Title className="text-foreground text-xl">Role principal</Title>
					<Text className="mt-1 text-muted-foreground text-sm leading-6">
						Choisissez le mode qui correspond le mieux a votre usage actuel.
					</Text>
					<View className="mt-3 self-start rounded-full bg-muted px-3 py-2">
						<Text className="font-sans-medium text-foreground text-xs">
							Role actuel: {currentRoleLabel}
						</Text>
					</View>

					<View className="mt-5 gap-3">
						{orderedRoleOptions.map((option) => {
							const isSelected = role === option.value;
							return (
								<TouchableOpacity
									key={option.label}
									activeOpacity={0.9}
									className={`rounded-2xl border px-4 py-4 ${
										isSelected
											? "border-primary bg-primary/10"
											: "border-border bg-background"
									}`}
									onPress={() => setRole(option.value)}
								>
									<View className="flex-row items-start gap-3">
										<View
											className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${
												isSelected
													? "bg-primary"
													: "border border-border bg-card"
											}`}
										>
											<Ionicons
												name={isSelected ? "checkmark" : "ellipse-outline"}
												size={14}
												color={isSelected ? "#ffffff" : "#b5a9c3"}
											/>
										</View>

										<View className="flex-1">
											<View className="flex-row items-center gap-2">
												<Text className="font-sans-medium text-base text-foreground">
													{option.label}
												</Text>
												{option.isUpcoming ? (
													<View className="rounded-full bg-muted px-2 py-1">
														<Text className="font-sans-medium text-[10px] text-muted-foreground">
															Bientot
														</Text>
													</View>
												) : null}
											</View>
											<Text className="mt-1 text-muted-foreground text-sm leading-6">
												{option.description}
											</Text>
										</View>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>

					<Text className="mt-4 text-muted-foreground text-xs leading-5">
						Les espaces Media / Radio et Prestataire technique restent en cours
						d&apos;amelioration, mais vous pouvez deja preparer votre profil.
					</Text>
				</Card>

				<View className="gap-3">
					<Button
						label={
							isSaving ? "Enregistrement..." : "Enregistrer les modifications"
						}
						loading={isSaving}
						onPress={handleSave}
					/>
					<Button
						label="Se deconnecter"
						variant="secondary"
						className="border-destructive/30 bg-destructive/10"
						textClassName="text-destructive"
						onPress={handleLogoutPress}
					/>
				</View>
			</KeyboardFormScreen>
		</Container>
	);
}
