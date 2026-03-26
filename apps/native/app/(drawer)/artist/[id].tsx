import { Ionicons } from "@expo/vector-icons";
import { MUSIC_GENRES } from "@rythmons/validation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Linking,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Container } from "@/components/container";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { useContextualBackNavigation } from "@/lib/use-contextual-back-navigation";
import { queryClient, trpc } from "@/utils/trpc";

interface SocialLinks {
	spotify: string;
	youtube: string;
	soundcloud: string;
	bandcamp: string;
	deezer: string;
	appleMusic: string;
}

interface FormData {
	stageName: string;
	city: string;
	postalCode: string;
	photoUrl: string;
	bannerUrl: string;
	bio: string;
	website: string;
	socialLinks: SocialLinks;
	techRequirements: string;
	feeMin: string;
	feeMax: string;
	isNegotiable: boolean;
	selectedGenres: string[];
	images: string[];
}

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type ArtistScreenData = {
	id: string;
	user?: {
		id?: string;
	} | null;
	stageName?: string | null;
	city?: string | null;
	postalCode?: string | null;
	photoUrl?: string | null;
	bannerUrl?: string | null;
	bio?: string | null;
	website?: string | null;
	socialLinks?: unknown;
	techRequirements?: string | null;
	feeMin?: number | null;
	feeMax?: number | null;
	isNegotiable?: boolean | null;
	genres?: Array<{ name: string }> | null;
	images?: string[] | null;
};

function readSocialLinks(value: unknown): Partial<SocialLinks> {
	if (typeof value !== "object" || value === null) {
		return {};
	}

	return value as Partial<SocialLinks>;
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

function isValidUrl(value: string) {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

export default function ArtistProfileScreen() {
	const params = useLocalSearchParams<{ id: string; backTo?: string }>();
	const artistId = Array.isArray(params.id) ? params.id[0] : params.id;
	const backTo = Array.isArray(params.backTo)
		? params.backTo[0]
		: params.backTo;

	const { data: session } = authClient.useSession();
	const handleBack = useContextualBackNavigation(backTo ?? "/(drawer)/artist");
	const insets = useSafeAreaInsets();
	const keyboardVerticalOffset = insets.top;
	const contentPaddingBottom = insets.bottom + 220;

	const {
		data: artistData,
		isLoading,
		refetch,
	} = useQuery({
		...trpc.artist.getById.queryOptions({ id: artistId ?? "" }),
		enabled: Boolean(artistId),
	});

	const artist = artistData as ArtistScreenData | null;

	const updateMutation = useMutation(trpc.artist.update.mutationOptions());
	const deleteMutation = useMutation(trpc.artist.delete.mutationOptions());

	const isOwner = useMemo(() => {
		if (!session?.user || !artist?.user?.id) return false;
		return session.user.id === artist.user.id;
	}, [artist?.user?.id, session?.user]);

	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [formData, setFormData] = useState<FormData>({
		stageName: "",
		city: "",
		postalCode: "",
		photoUrl: "",
		bannerUrl: "",
		bio: "",
		website: "",
		socialLinks: {
			spotify: "",
			youtube: "",
			soundcloud: "",
			bandcamp: "",
			deezer: "",
			appleMusic: "",
		},
		techRequirements: "",
		feeMin: "",
		feeMax: "",
		isNegotiable: false,
		selectedGenres: [],
		images: [],
	});
	const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
		{},
	);

	useEffect(() => {
		if (!artist) return;
		const sl = readSocialLinks(artist.socialLinks);
		setFormData({
			stageName: artist.stageName ?? "",
			city: artist.city ?? "",
			postalCode: artist.postalCode ?? "",
			photoUrl: artist.photoUrl ?? "",
			bannerUrl: artist.bannerUrl ?? "",
			bio: artist.bio ?? "",
			website: artist.website ?? "",
			socialLinks: {
				spotify: sl.spotify || "",
				youtube: sl.youtube || "",
				soundcloud: sl.soundcloud || "",
				bandcamp: sl.bandcamp || "",
				deezer: sl.deezer || "",
				appleMusic: sl.appleMusic || "",
			},
			techRequirements: artist.techRequirements ?? "",
			feeMin: artist.feeMin != null ? String(artist.feeMin) : "",
			feeMax: artist.feeMax != null ? String(artist.feeMax) : "",
			isNegotiable: artist.isNegotiable ?? false,
			selectedGenres: artist.genres?.map((g) => g.name) ?? [],
			images: artist.images ?? [],
		});
	}, [artist]);

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
		if (
			formData.postalCode.trim() &&
			!/^\d{5}$/.test(formData.postalCode.trim())
		) {
			newErrors.postalCode = "Code postal invalide (5 chiffres)";
		}
		if (formData.website && !isValidUrl(formData.website)) {
			newErrors.website = "URL invalide";
		}
		for (const value of Object.values(formData.socialLinks)) {
			if (value && !isValidUrl(value)) {
				newErrors.socialLinks =
					"Tous les liens musique doivent être des URLs valides";
				break;
			}
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

	const handleSave = async () => {
		if (!artistId) return;
		if (!validate()) {
			Alert.alert(
				"Erreur",
				"Veuillez corriger les erreurs dans le formulaire.",
			);
			return;
		}

		setIsSaving(true);
		try {
			const normalizedSocialLinks = Object.fromEntries(
				Object.entries(formData.socialLinks).map(([key, value]) => [
					key,
					value.trim(),
				]),
			) as SocialLinks;
			await updateMutation.mutateAsync({
				id: artistId,
				data: {
					stageName: formData.stageName.trim(),
					city: normalizeOptionalString(formData.city),
					postalCode: normalizeOptionalString(formData.postalCode),
					photoUrl: normalizeOptionalString(formData.photoUrl),
					bannerUrl: normalizeOptionalString(formData.bannerUrl),
					bio: normalizeOptionalString(formData.bio),
					website: normalizeOptionalString(formData.website),
					socialLinks: normalizedSocialLinks,
					techRequirements: normalizeOptionalString(formData.techRequirements),
					feeMin: parseOptionalInt(formData.feeMin),
					feeMax: parseOptionalInt(formData.feeMax),
					isNegotiable: formData.isNegotiable,
					genreNames: formData.selectedGenres,
					images: formData.images,
				},
			});

			await queryClient.invalidateQueries();
			setIsEditing(false);
			await refetch();
			Alert.alert("Succès", "Artiste mis à jour !");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
			Alert.alert("Erreur", message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!artistId) return;
		try {
			await deleteMutation.mutateAsync({ id: artistId });
			await queryClient.invalidateQueries();
			Alert.alert("Artiste supprimé", "", [
				{
					text: "OK",
					onPress: () =>
						router.replace((backTo ?? "/(drawer)/artist") as never),
				},
			]);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Erreur lors de la suppression";
			Alert.alert("Erreur", message);
		}
	};

	const handleOpenWebsite = async () => {
		if (!artist?.website) return;
		try {
			await Linking.openURL(artist.website);
		} catch {
			Alert.alert("Erreur", "Impossible d’ouvrir ce lien.");
		}
	};

	if (!artistId) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Text className="text-center text-muted-foreground">
						Identifiant d’artiste manquant.
					</Text>
				</View>
			</Container>
		);
	}

	if (isLoading) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
					<Text className="mt-2 text-muted-foreground">Chargement...</Text>
				</View>
			</Container>
		);
	}

	if (!artist) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Title className="mb-2 text-2xl">Artiste introuvable</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Ce profil n’existe pas ou n’est plus disponible.
					</Text>
					<TouchableOpacity
						className="rounded-lg bg-primary px-4 py-2"
						onPress={handleBack}
					>
						<Text className="font-sans-medium text-primary-foreground">
							Retour à la liste
						</Text>
					</TouchableOpacity>
				</View>
			</Container>
		);
	}

	const genres = artist.genres ?? [];
	const genreLabel =
		genres.length > 0 ? genres.map((genre) => genre.name).join(" • ") : null;

	return (
		<Container>
			<KeyboardAvoidingView
				behavior="padding"
				className="flex-1"
				keyboardVerticalOffset={
					Platform.OS === "ios" ? keyboardVerticalOffset : 0
				}
			>
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						flexGrow: 1,
						paddingTop: 16,
						paddingBottom: contentPaddingBottom,
						paddingHorizontal: 16,
					}}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="interactive"
					contentInsetAdjustmentBehavior="always"
				>
					{artist.bannerUrl ? (
						<Image
							source={{ uri: artist.bannerUrl }}
							className="h-40 w-full"
							resizeMode="cover"
						/>
					) : (
						<View className="h-40 w-full bg-primary/10" />
					)}

					<View className="-mt-10 px-4">
						<View className="rounded-2xl border border-border bg-card p-4">
							<View className="flex-row items-center gap-3">
								{artist.photoUrl ? (
									<Image
										source={{ uri: artist.photoUrl }}
										className="h-16 w-16 rounded-full border border-border"
									/>
								) : (
									<View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
										<Ionicons name="person" size={28} color="#7c3aed" />
									</View>
								)}

								<View className="flex-1">
									<Title className="text-2xl text-foreground">
										{artist.stageName}
									</Title>
									{genreLabel ? (
										<Text className="text-muted-foreground">{genreLabel}</Text>
									) : null}
								</View>

								{isOwner ? (
									<TouchableOpacity
										className="rounded-lg bg-primary/10 px-3 py-2"
										onPress={() => setIsEditing((v) => !v)}
									>
										<Text className="font-sans-medium text-primary">
											{isEditing ? "Voir" : "Modifier"}
										</Text>
									</TouchableOpacity>
								) : null}
							</View>

							{artist.website && !isEditing ? (
								<TouchableOpacity
									className="mt-4 flex-row items-center rounded-lg border border-border bg-background px-3 py-3"
									onPress={handleOpenWebsite}
								>
									<Ionicons
										name="link"
										size={18}
										color="#9ca3af"
										style={{ marginRight: 8 }}
									/>
									<Text
										className="flex-1 text-muted-foreground"
										numberOfLines={1}
									>
										{artist.website}
									</Text>
									<Ionicons name="open-outline" size={18} color="#9ca3af" />
								</TouchableOpacity>
							) : null}

							{!isEditing
								? (() => {
										const sl = readSocialLinks(artist.socialLinks);
										const links = [
											{
												key: "spotify",
												label: "Spotify",
												url: sl.spotify,
												icon: "link",
											},
											{
												key: "youtube",
												label: "YouTube",
												url: sl.youtube,
												icon: "link",
											},
											{
												key: "soundcloud",
												label: "SoundCloud",
												url: sl.soundcloud,
												icon: "link",
											},
											{
												key: "bandcamp",
												label: "Bandcamp",
												url: sl.bandcamp,
												icon: "link",
											},
											{
												key: "deezer",
												label: "Deezer",
												url: sl.deezer,
												icon: "link",
											},
											{
												key: "appleMusic",
												label: "Apple Music",
												url: sl.appleMusic,
												icon: "link",
											},
										] satisfies Array<{
											key: keyof SocialLinks;
											label: string;
											url?: string;
											icon: IoniconName;
										}>;
										const visibleLinks = links.filter((link) => link.url);

										if (visibleLinks.length === 0) return null;

										return (
											<View className="mt-4 flex-row flex-wrap gap-2">
												{visibleLinks.map((link) => (
													<TouchableOpacity
														key={link.key}
														className="flex-row items-center rounded-full bg-primary/10 px-3 py-2"
														onPress={() =>
															Linking.openURL(link.url || "").catch(() => {})
														}
													>
														<Ionicons
															name={link.icon}
															size={14}
															color="#7c3aed"
															style={{ marginRight: 6 }}
														/>
														<Text className="font-sans-medium text-primary text-sm">
															{link.label}
														</Text>
													</TouchableOpacity>
												))}
											</View>
										);
									})()
								: null}
						</View>

						<View className="mt-6 space-y-6">
							{isEditing ? (
								<View className="space-y-6">
									<View className="rounded-xl border border-border bg-card p-4">
										<Text className="mb-3 font-sans-bold text-foreground">
											Édition
										</Text>

										<View className="space-y-4">
											<View>
												<Text className="mb-1 font-sans-medium text-foreground text-sm">
													Nom de scène *
												</Text>
												<Input
													className={`rounded-lg border p-3 text-foreground ${
														errors.stageName
															? "border-red-500"
															: "border-border"
													} bg-background`}
													value={formData.stageName}
													onChangeText={(v) => updateField("stageName", v)}
													placeholderTextColor="#666"
												/>
												{errors.stageName ? (
													<Text className="mt-1 text-red-500 text-xs">
														{errors.stageName}
													</Text>
												) : null}
											</View>

											<View className="flex-row gap-3">
												<View className="flex-1">
													<Text className="mb-1 font-sans-medium text-foreground text-sm">
														Ville
													</Text>
													<Input
														className="rounded-lg border border-border bg-background p-3 text-foreground"
														value={formData.city}
														onChangeText={(v) => updateField("city", v)}
														placeholder="Ex: Paris"
														placeholderTextColor="#666"
													/>
												</View>
												<View className="flex-1">
													<Text className="mb-1 font-sans-medium text-foreground text-sm">
														Code postal
													</Text>
													<Input
														className={`rounded-lg border p-3 text-foreground ${
															errors.postalCode
																? "border-red-500"
																: "border-border"
														} bg-background`}
														value={formData.postalCode}
														onChangeText={(v) => updateField("postalCode", v)}
														placeholder="Ex: 75000"
														placeholderTextColor="#666"
													/>
													{errors.postalCode ? (
														<Text className="mt-1 text-red-500 text-xs">
															{errors.postalCode}
														</Text>
													) : null}
												</View>
											</View>

											<View>
												<Text className="mb-1 font-sans-medium text-foreground text-sm">
													Bio
												</Text>
												<Input
													className="min-h-[100px] rounded-lg border border-border bg-background p-3 text-foreground"
													value={formData.bio}
													onChangeText={(v) => updateField("bio", v)}
													placeholderTextColor="#666"
													multiline
													textAlignVertical="top"
												/>
											</View>

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
												{errors.website ? (
													<Text className="mt-1 text-red-500 text-xs">
														{errors.website}
													</Text>
												) : null}
											</View>

											<View className="space-y-4 pt-2">
												<Text className="font-sans-bold text-foreground">
													Liens musique
												</Text>
												{(
													[
														[
															"spotify",
															"Spotify",
															"https://open.spotify.com/artist/...",
														],
														["youtube", "YouTube", "https://youtube.com/@..."],
														[
															"soundcloud",
															"SoundCloud",
															"https://soundcloud.com/...",
														],
														[
															"bandcamp",
															"Bandcamp",
															"https://....bandcamp.com",
														],
														[
															"deezer",
															"Deezer",
															"https://www.deezer.com/artist/...",
														],
														[
															"appleMusic",
															"Apple Music",
															"https://music.apple.com/artist/...",
														],
													] as [keyof SocialLinks, string, string][]
												).map(([key, label, placeholder]) => (
													<View key={key}>
														<Text className="mb-1 font-sans-medium text-foreground text-sm">
															{label}
														</Text>
														<Input
															className="rounded-lg border border-border bg-background p-3 text-foreground"
															value={formData.socialLinks[key]}
															onChangeText={(v) =>
																updateField("socialLinks", {
																	...formData.socialLinks,
																	[key]: v,
																})
															}
															placeholder={placeholder}
															placeholderTextColor="#666"
															autoCapitalize="none"
															keyboardType="url"
														/>
													</View>
												))}
												{errors.socialLinks ? (
													<Text className="text-red-500 text-xs">
														{errors.socialLinks}
													</Text>
												) : null}
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

											<View className="mt-4 flex-row items-center space-x-2">
												<TouchableOpacity
													className={`h-6 w-11 rounded-full ${
														formData.isNegotiable
															? "bg-primary"
															: "bg-zinc-200 dark:bg-zinc-700"
													} justify-center px-1`}
													onPress={() =>
														updateField("isNegotiable", !formData.isNegotiable)
													}
												>
													<View
														className={`h-4 w-4 rounded-full bg-white transition-transform ${
															formData.isNegotiable
																? "translate-x-5"
																: "translate-x-0"
														}`}
													/>
												</TouchableOpacity>
												<Text className="ml-2 font-sans-medium text-foreground text-sm">
													Cachet négociable
												</Text>
											</View>

											<View>
												<Text className="mb-1 font-sans-medium text-foreground text-sm">
													Infos techniques
												</Text>
												<Input
													className="min-h-[100px] rounded-lg border border-border bg-background p-3 text-foreground"
													value={formData.techRequirements}
													onChangeText={(v) =>
														updateField("techRequirements", v)
													}
													placeholderTextColor="#666"
													multiline
													textAlignVertical="top"
												/>
											</View>
										</View>
									</View>

									<View className="rounded-xl border border-border bg-card p-4">
										<Text className="mb-3 font-sans-bold text-foreground">
											Genres
										</Text>
										<View className="flex-row flex-wrap gap-2">
											{MUSIC_GENRES.map((genre) => {
												const isSelected =
													formData.selectedGenres.includes(genre);
												return (
													<TouchableOpacity
														key={genre}
														onPress={() => {
															updateField(
																"selectedGenres",
																isSelected
																	? formData.selectedGenres.filter(
																			(g) => g !== genre,
																		)
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
										<Text className="mb-3 font-sans-bold text-foreground">
											Visuels
										</Text>

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
															Alert.alert(
																"Info",
																"Cette image est déjà ajoutée.",
															);
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
																		<Ionicons
																			name="trash"
																			size={14}
																			color="white"
																		/>
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

									<View className="space-y-3">
										<TouchableOpacity
											className="flex-row items-center justify-center rounded-xl bg-primary p-4 disabled:opacity-70"
											onPress={handleSave}
											disabled={isSaving}
										>
											{isSaving ? (
												<ActivityIndicator
													color="white"
													style={{ marginRight: 8 }}
												/>
											) : (
												<Ionicons
													name="save-outline"
													size={20}
													color="white"
													style={{ marginRight: 8 }}
												/>
											)}
											<Text className="font-sans-bold text-primary-foreground">
												{isSaving ? "Enregistrement..." : "Enregistrer"}
											</Text>
										</TouchableOpacity>

										<TouchableOpacity
											className="flex-row items-center justify-center rounded-xl border border-border bg-background p-4"
											onPress={() => {
												setIsEditing(false);
												setErrors({});
												if (artist) {
													const sl = readSocialLinks(artist.socialLinks);
													setFormData({
														stageName: artist.stageName ?? "",
														city: artist.city ?? "",
														postalCode: artist.postalCode ?? "",
														photoUrl: artist.photoUrl ?? "",
														bannerUrl: artist.bannerUrl ?? "",
														bio: artist.bio ?? "",
														website: artist.website ?? "",
														socialLinks: {
															spotify: sl.spotify || "",
															youtube: sl.youtube || "",
															soundcloud: sl.soundcloud || "",
															bandcamp: sl.bandcamp || "",
															deezer: sl.deezer || "",
															appleMusic: sl.appleMusic || "",
														},
														techRequirements: artist.techRequirements ?? "",
														feeMin:
															artist.feeMin != null
																? String(artist.feeMin)
																: "",
														feeMax:
															artist.feeMax != null
																? String(artist.feeMax)
																: "",
														isNegotiable: artist.isNegotiable ?? false,
														selectedGenres:
															artist.genres?.map((g) => g.name) ?? [],
														images: artist.images ?? [],
													});
												}
											}}
										>
											<Text className="font-sans-medium text-foreground">
												Annuler
											</Text>
										</TouchableOpacity>

										<TouchableOpacity
											className="flex-row items-center justify-center rounded-xl bg-destructive p-4 disabled:opacity-70"
											onPress={handleDelete}
											disabled={deleteMutation.isPending}
										>
											<Ionicons
												name="trash"
												size={20}
												color="white"
												style={{ marginRight: 8 }}
											/>
											<Text className="font-sans-bold text-white">
												{deleteMutation.isPending
													? "Suppression..."
													: "Supprimer"}
											</Text>
										</TouchableOpacity>
									</View>

									<View className="h-8" />
								</View>
							) : (
								<View className="space-y-6">
									{artist.bio ? (
										<View className="rounded-xl border border-border bg-card p-4">
											<Text className="font-sans-bold text-foreground">
												Bio
											</Text>
											<Text className="mt-2 text-muted-foreground">
												{artist.bio}
											</Text>
										</View>
									) : null}

									{artist.feeMin != null ||
									artist.feeMax != null ||
									artist.isNegotiable ? (
										<View className="rounded-xl border border-border bg-card p-4">
											<Text className="font-sans-bold text-foreground">
												Cachet
											</Text>
											<Text className="mt-2 text-muted-foreground">
												{artist.feeMin != null ? `${artist.feeMin}€` : "—"}{" "}
												{artist.feeMax != null ? `→ ${artist.feeMax}€` : ""}
												{artist.isNegotiable ? " (Négociable)" : ""}
											</Text>
										</View>
									) : null}

									{artist.techRequirements ? (
										<View className="rounded-xl border border-border bg-card p-4">
											<Text className="font-sans-bold text-foreground">
												Infos techniques
											</Text>
											<Text className="mt-2 text-muted-foreground">
												{artist.techRequirements}
											</Text>
										</View>
									) : null}

									{artist.images?.length ? (
										<View className="rounded-xl border border-border bg-card p-4">
											<Text className="font-sans-bold text-foreground">
												Galerie
											</Text>
											<ScrollView
												horizontal
												className="mt-3"
												showsHorizontalScrollIndicator={false}
											>
												<View className="flex-row gap-3">
													{artist.images.map((url: string) => (
														<Image
															key={url}
															source={{ uri: url }}
															className="h-24 w-24 rounded-lg border border-border"
														/>
													))}
												</View>
											</ScrollView>
										</View>
									) : null}
								</View>
							)}
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Container>
	);
}
