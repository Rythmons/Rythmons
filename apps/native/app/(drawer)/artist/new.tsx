import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

interface FormData {
	stageName: string;
	photoUrl: string;
	bannerUrl: string;
	bio: string;
	website: string;
	techRequirements: string;
	feeMin: string;
	feeMax: string;
	selectedGenres: string[];
	images: string[];
}

function normalizeOptionalString(value: string) {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalInt(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const parsed = Number.parseInt(trimmed, 10);
	return Number.isFinite(parsed) ? parsed : null;
}

export default function NewArtistScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();

	const { data: availableGenres = [] } = useQuery({
		...trpc.venue.getAllGenres.queryOptions(),
		enabled: Boolean(session?.user),
	});

	const createMutation = useMutation(trpc.artist.create.mutationOptions());

	const [formData, setFormData] = useState<FormData>({
		stageName: "",
		photoUrl: "",
		bannerUrl: "",
		bio: "",
		website: "",
		techRequirements: "",
		feeMin: "",
		feeMax: "",
		selectedGenres: [],
		images: [],
	});

	const [isSaving, setIsSaving] = useState(false);
	const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
		{},
	);

	const canSubmit = useMemo(
		() => formData.stageName.trim().length >= 2,
		[formData.stageName],
	);

	const updateField = <K extends keyof FormData>(
		key: K,
		value: FormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const validate = () => {
		const newErrors: Partial<Record<keyof FormData, string>> = {};

		if (formData.stageName.trim().length < 2) {
			newErrors.stageName =
				"Le nom de scène doit contenir au moins 2 caractères";
		}

		const feeMin = parseOptionalInt(formData.feeMin);
		const feeMax = parseOptionalInt(formData.feeMax);
		if (feeMin !== null && feeMax !== null && feeMax < feeMin) {
			newErrors.feeMax = "Le cachet max doit être ≥ au cachet min";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const removeImage = (url: string) => {
		updateField(
			"images",
			formData.images.filter((img) => img !== url),
		);
	};

	const handleCreate = async () => {
		if (!validate()) {
			Alert.alert(
				"Erreur",
				"Veuillez corriger les erreurs dans le formulaire.",
			);
			return;
		}

		setIsSaving(true);
		try {
			const created = await createMutation.mutateAsync({
				stageName: formData.stageName.trim(),
				photoUrl: normalizeOptionalString(formData.photoUrl),
				bannerUrl: normalizeOptionalString(formData.bannerUrl),
				bio: normalizeOptionalString(formData.bio),
				website: normalizeOptionalString(formData.website),
				techRequirements: normalizeOptionalString(formData.techRequirements),
				feeMin: parseOptionalInt(formData.feeMin),
				feeMax: parseOptionalInt(formData.feeMax),
				genreNames: formData.selectedGenres,
				images: formData.images,
			});

			await queryClient.invalidateQueries();
			router.replace(`/artist/${created.id}`);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Erreur lors de la création";
			Alert.alert("Erreur", message);
		} finally {
			setIsSaving(false);
		}
	};

	if (sessionPending) {
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
				<View className="flex-1 items-center justify-center px-6">
					<Text className="mb-4 text-center text-foreground">
						Vous devez être connecté pour créer un artiste.
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
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView className="flex-1 p-4">
					<View className="mb-6">
						<Title className="text-2xl text-foreground">Créer un artiste</Title>
						<Text className="text-muted-foreground">
							Complétez votre profil public.
						</Text>
					</View>

					<View className="space-y-6">
						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="person" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">
									Informations
								</Text>
							</View>

							<View className="space-y-4">
								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Nom de scène *
									</Text>
									<Input
										className={`rounded-lg border p-3 text-foreground ${
											errors.stageName ? "border-red-500" : "border-border"
										} bg-background`}
										value={formData.stageName}
										onChangeText={(v) => updateField("stageName", v)}
										placeholder="Ex: DJ Rythmons"
										placeholderTextColor="#666"
									/>
									{errors.stageName ? (
										<Text className="mt-1 text-red-500 text-xs">
											{errors.stageName}
										</Text>
									) : null}
								</View>

								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Bio
									</Text>
									<Input
										className="min-h-[100px] rounded-lg border border-border bg-background p-3 text-foreground"
										value={formData.bio}
										onChangeText={(v) => updateField("bio", v)}
										placeholder="Parlez de votre projet, influences, expérience…"
										placeholderTextColor="#666"
										multiline
										textAlignVertical="top"
									/>
								</View>
							</View>
						</View>

						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="musical-notes" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">Genres</Text>
							</View>

							<Text className="mb-3 text-muted-foreground text-sm">
								Sélectionnez vos styles.
							</Text>

							<View className="flex-row flex-wrap gap-2">
								{availableGenres.map((genre) => {
									const isSelected = formData.selectedGenres.includes(genre);
									return (
										<TouchableOpacity
											key={genre}
											onPress={() => {
												updateField(
													"selectedGenres",
													isSelected
														? formData.selectedGenres.filter((g) => g !== genre)
														: [...formData.selectedGenres, genre],
												);
											}}
											className={`rounded-full px-3 py-2 ${
												isSelected
													? "bg-primary"
													: "border border-border bg-background"
											}`}
										>
											<Text
												className={`text-sm ${
													isSelected
														? "font-sans-medium text-primary-foreground"
														: "text-foreground"
												}`}
											>
												{genre}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>

						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="link" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">Liens</Text>
							</View>

							<View className="space-y-4">
								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Site web
									</Text>
									<Input
										className="rounded-lg border border-border bg-background p-3 text-foreground"
										value={formData.website}
										onChangeText={(v) => updateField("website", v)}
										placeholder="https://..."
										placeholderTextColor="#666"
										autoCapitalize="none"
										keyboardType="url"
									/>
								</View>
							</View>
						</View>

						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="cash" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">Cachet</Text>
							</View>

							<View className="flex-row gap-3">
								<View className="flex-1">
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Min (€)
									</Text>
									<Input
										className="rounded-lg border border-border bg-background p-3 text-foreground"
										value={formData.feeMin}
										onChangeText={(v) => updateField("feeMin", v)}
										placeholder="200"
										placeholderTextColor="#666"
										keyboardType="numeric"
									/>
								</View>
								<View className="flex-1">
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Max (€)
									</Text>
									<Input
										className={`rounded-lg border p-3 text-foreground ${
											errors.feeMax ? "border-red-500" : "border-border"
										} bg-background`}
										value={formData.feeMax}
										onChangeText={(v) => updateField("feeMax", v)}
										placeholder="800"
										placeholderTextColor="#666"
										keyboardType="numeric"
									/>
									{errors.feeMax ? (
										<Text className="mt-1 text-red-500 text-xs">
											{errors.feeMax}
										</Text>
									) : null}
								</View>
							</View>
						</View>

						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="settings" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">
									Infos techniques
								</Text>
							</View>

							<Input
								className="min-h-[100px] rounded-lg border border-border bg-background p-3 text-foreground"
								value={formData.techRequirements}
								onChangeText={(v) => updateField("techRequirements", v)}
								placeholder="Line up, rider technique, besoins spécifiques…"
								placeholderTextColor="#666"
								multiline
								textAlignVertical="top"
							/>
						</View>

						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="image" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">Visuels</Text>
							</View>

							<View className="space-y-4">
								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Photo (avatar)
									</Text>
									<View className="max-w-[220px]">
										<ImageUpload
											value={formData.photoUrl || undefined}
											onChange={(url) => updateField("photoUrl", url)}
											onRemove={() => updateField("photoUrl", "")}
											label="Choisir une photo (1:1)"
											aspectRatio="square"
											disabled={isSaving}
										/>
									</View>
								</View>
								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Bannière
									</Text>
									<ImageUpload
										value={formData.bannerUrl || undefined}
										onChange={(url) => updateField("bannerUrl", url)}
										onRemove={() => updateField("bannerUrl", "")}
										label="Choisir une bannière (16:9)"
										aspectRatio="video"
										disabled={isSaving}
									/>
								</View>

								<View className="rounded-lg border border-border bg-background p-3">
									<Text className="mb-2 font-sans-medium text-foreground text-sm">
										Galerie
									</Text>
									<ImageUpload
										label="Ajouter une image"
										onChange={(url) => {
											if (formData.images.includes(url)) {
												Alert.alert("Info", "Cette image est déjà ajoutée.");
												return;
											}
											updateField("images", [...formData.images, url]);
										}}
										aspectRatio="square"
										disabled={isSaving}
									/>

									{formData.images.length > 0 ? (
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											className="mt-3"
										>
											<View className="flex-row gap-3">
												{formData.images.map((url) => (
													<View
														key={url}
														className="overflow-hidden rounded-lg border border-border bg-background"
													>
														<Image
															source={{ uri: url }}
															className="h-24 w-24"
															resizeMode="cover"
														/>
														<TouchableOpacity
															className="absolute top-1 right-1 rounded-full bg-black/60 p-1"
															onPress={() => removeImage(url)}
														>
															<Ionicons name="trash" size={14} color="white" />
														</TouchableOpacity>
													</View>
												))}
											</View>
										</ScrollView>
									) : (
										<Text className="mt-2 text-muted-foreground text-xs">
											Aucune image ajoutée.
										</Text>
									)}
								</View>
							</View>
						</View>

						<TouchableOpacity
							className="flex-row items-center justify-center rounded-xl bg-primary p-4 disabled:opacity-70"
							onPress={handleCreate}
							disabled={isSaving || !canSubmit}
						>
							{isSaving ? (
								<ActivityIndicator color="white" style={{ marginRight: 8 }} />
							) : (
								<Ionicons
									name="save-outline"
									size={20}
									color="white"
									style={{ marginRight: 8 }}
								/>
							)}
							<Text className="font-sans-bold text-primary-foreground">
								{isSaving ? "Création..." : "Créer l’artiste"}
							</Text>
						</TouchableOpacity>

						<View className="h-8" />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Container>
	);
}
