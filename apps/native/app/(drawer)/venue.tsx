import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

// Venue types with French labels
const VENUE_TYPES = [
	{ value: "BAR", label: "Bar" },
	{ value: "CLUB", label: "Club / Discothèque" },
	{ value: "CONCERT_HALL", label: "Salle de concert" },
	{ value: "FESTIVAL", label: "Festival" },
	{ value: "CAFE", label: "Café-concert" },
	{ value: "RESTAURANT", label: "Restaurant" },
	{ value: "CULTURAL_CENTER", label: "Centre culturel" },
	{ value: "THEATER", label: "Théâtre" },
	{ value: "OPEN_AIR", label: "Plein air" },
	{ value: "OTHER", label: "Autre" },
] as const;

type VenueType = (typeof VENUE_TYPES)[number]["value"];

interface FormData {
	name: string;
	address: string;
	city: string;
	postalCode: string;
	country: string;
	venueType: VenueType;
	capacity: string;
	description: string;
	photoUrl: string;
	logoUrl: string;
	selectedGenres: string[];
}

export default function VenueScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const {
		data: venues,
		isLoading: venueLoading,
		refetch,
	} = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: !!session?.user,
	});

	const venue = venues?.[0];

	// Fetch available genres
	const { data: availableGenres = [] } = useQuery({
		...trpc.venue.getAllGenres.queryOptions(),
		enabled: !!session?.user,
	});

	const [formData, setFormData] = useState<FormData>({
		name: "",
		address: "",
		city: "",
		postalCode: "",
		country: "France",
		venueType: "BAR",
		capacity: "",
		description: "",
		photoUrl: "",
		logoUrl: "",
		selectedGenres: [],
	});
	const [isSaving, setIsSaving] = useState(false);
	const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
		{},
	);

	const createMutation = useMutation(trpc.venue.create.mutationOptions());
	const updateMutation = useMutation(trpc.venue.update.mutationOptions());

	// Populate form when venue data loads
	useEffect(() => {
		if (venue) {
			setFormData({
				name: venue.name,
				address: venue.address,
				city: venue.city,
				postalCode: venue.postalCode,
				country: venue.country,
				venueType: venue.venueType as VenueType,
				capacity: venue.capacity?.toString() ?? "",
				description: venue.description ?? "",
				photoUrl: venue.photoUrl ?? "",
				logoUrl: venue.logoUrl ?? "",
				selectedGenres: venue.genres?.map((g) => g.name) ?? [],
			});
		}
	}, [venue]);

	const updateField = <K extends keyof FormData>(
		key: K,
		value: FormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) {
			setErrors((prev) => ({ ...prev, [key]: undefined }));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof FormData, string>> = {};

		if (!formData.name || formData.name.length < 2) {
			newErrors.name = "Le nom doit contenir au moins 2 caractères";
		}
		if (!formData.address || formData.address.length < 5) {
			newErrors.address = "L'adresse est requise";
		}
		if (!formData.city || formData.city.length < 2) {
			newErrors.city = "La ville est requise";
		}
		if (!formData.postalCode || !/^\d{5}$/.test(formData.postalCode)) {
			newErrors.postalCode = "Code postal invalide";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm()) {
			Alert.alert("Erreur", "Veuillez corriger les erreurs dans le formulaire");
			return;
		}

		setIsSaving(true);
		try {
			const { selectedGenres, ...restData } = formData;
			const submitData = {
				...restData,
				capacity: formData.capacity
					? Number.parseInt(formData.capacity, 10)
					: null,
				description: formData.description || null,
				photoUrl: formData.photoUrl || null,
				logoUrl: formData.logoUrl || null,
				genreNames: selectedGenres,
			};

			if (venue) {
				await updateMutation.mutateAsync({
					id: venue.id,
					data: submitData,
				});
				Alert.alert("Succès", "Lieu mis à jour !");
			} else {
				await createMutation.mutateAsync(submitData);
				Alert.alert("Succès", "Lieu créé avec succès !");
			}

			await refetch();
			await queryClient.invalidateQueries();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
			Alert.alert("Erreur", message);
		} finally {
			setIsSaving(false);
		}
	};

	if (sessionPending || venueLoading) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
					<Text className="mt-2 text-muted-foreground">Chargement...</Text>
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

	const isNewVenue = !venue;

	return (
		<Container>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView className="flex-1 p-4">
					{/* Header */}
					{isNewVenue ? (
						<View className="mb-6 rounded-xl bg-primary/10 p-4">
							<View className="flex-row items-center gap-3">
								<View className="rounded-lg bg-primary/20 p-2">
									<Ionicons name="business" size={24} color="#7c3aed" />
								</View>
								<View className="flex-1">
									<Title className="text-foreground text-lg">
										Créer votre lieu
									</Title>
									<Text className="text-muted-foreground text-sm">
										Remplissez les informations pour recevoir des propositions
									</Text>
								</View>
							</View>
						</View>
					) : (
						<View className="mb-6">
							<Title className="text-2xl text-foreground">Mon Lieu</Title>
							<Text className="text-muted-foreground">
								Gérez les informations de votre établissement
							</Text>
						</View>
					)}

					{/* Preview Card (if editing) */}
					{venue?.photoUrl && (
						<View className="mb-6 overflow-hidden rounded-xl border border-border">
							<Image
								source={{ uri: venue.photoUrl }}
								className="h-32 w-full"
								resizeMode="cover"
							/>
							<View className="p-4">
								<Title className="text-foreground text-lg">{venue.name}</Title>
								<Text className="text-muted-foreground">
									{venue.city} • {getVenueTypeLabel(venue.venueType)}
								</Text>
							</View>
						</View>
					)}

					{/* Form */}
					<View className="space-y-6">
						{/* Basic Info Section */}
						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="information-circle" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">
									Informations générales
								</Text>
							</View>

							<View className="space-y-4">
								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Nom du lieu *
									</Text>
									<Input
										className={`rounded-lg border p-3 text-foreground ${
											errors.name ? "border-red-500" : "border-border"
										} bg-background`}
										value={formData.name}
										onChangeText={(v) => updateField("name", v)}
										placeholder="Ex: Le Petit Journal"
										placeholderTextColor="#666"
									/>
									{errors.name && (
										<Text className="mt-1 text-red-500 text-xs">
											{errors.name}
										</Text>
									)}
								</View>

								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Type de lieu *
									</Text>
									<View className="rounded-lg border border-border bg-background">
										<Picker
											selectedValue={formData.venueType}
											onValueChange={(v) => updateField("venueType", v)}
											style={{ color: "#fff" }}
										>
											{VENUE_TYPES.map((type) => (
												<Picker.Item
													key={type.value}
													label={type.label}
													value={type.value}
												/>
											))}
										</Picker>
									</View>
								</View>
							</View>
						</View>

						{/* Address Section */}
						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="location" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">Adresse</Text>
							</View>

							<View className="space-y-4">
								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										Adresse complète *
									</Text>
									<Input
										className={`rounded-lg border p-3 text-foreground ${
											errors.address ? "border-red-500" : "border-border"
										} bg-background`}
										value={formData.address}
										onChangeText={(v) => updateField("address", v)}
										placeholder="123 Rue de la Musique"
										placeholderTextColor="#666"
									/>
									{errors.address && (
										<Text className="mt-1 text-red-500 text-xs">
											{errors.address}
										</Text>
									)}
								</View>

								<View className="flex-row gap-3">
									<View className="flex-1">
										<Text className="mb-1 font-sans-medium text-foreground text-sm">
											Ville *
										</Text>
										<Input
											className={`rounded-lg border p-3 text-foreground ${
												errors.city ? "border-red-500" : "border-border"
											} bg-background`}
											value={formData.city}
											onChangeText={(v) => updateField("city", v)}
											placeholder="Paris"
											placeholderTextColor="#666"
										/>
										{errors.city && (
											<Text className="mt-1 text-red-500 text-xs">
												{errors.city}
											</Text>
										)}
									</View>

									<View className="w-28">
										<Text className="mb-1 font-sans-medium text-foreground text-sm">
											Code postal *
										</Text>
										<Input
											className={`rounded-lg border p-3 text-foreground ${
												errors.postalCode ? "border-red-500" : "border-border"
											} bg-background`}
											value={formData.postalCode}
											onChangeText={(v) => updateField("postalCode", v)}
											placeholder="75001"
											placeholderTextColor="#666"
											maxLength={5}
											keyboardType="numeric"
										/>
									</View>
								</View>
							</View>
						</View>

						{/* Capacity Section */}
						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="people" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">Capacité</Text>
							</View>

							<View>
								<Text className="mb-1 font-sans-medium text-foreground text-sm">
									Capacité d'accueil
								</Text>
								<Input
									className="rounded-lg border border-border bg-background p-3 text-foreground"
									value={formData.capacity}
									onChangeText={(v) => updateField("capacity", v)}
									placeholder="200"
									placeholderTextColor="#666"
									keyboardType="numeric"
								/>
								<Text className="mt-1 text-muted-foreground text-xs">
									Optionnel - Nombre de personnes
								</Text>
							</View>
						</View>

						{/* Music Genres Section */}
						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="musical-notes" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">
									Genres musicaux programmés
								</Text>
							</View>

							<Text className="mb-3 text-muted-foreground text-sm">
								Sélectionnez les genres que vous programmez habituellement
							</Text>

							<View className="flex-row flex-wrap gap-2">
								{availableGenres.map((genre) => {
									const isSelected = formData.selectedGenres.includes(genre);
									return (
										<TouchableOpacity
											key={genre}
											onPress={() => {
												if (isSelected) {
													updateField(
														"selectedGenres",
														formData.selectedGenres.filter((g) => g !== genre),
													);
												} else {
													updateField("selectedGenres", [
														...formData.selectedGenres,
														genre,
													]);
												}
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

							{formData.selectedGenres.length > 0 && (
								<Text className="mt-3 text-muted-foreground text-xs">
									{formData.selectedGenres.length} genre(s) sélectionné(s)
								</Text>
							)}
						</View>

						{/* Description Section */}
						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="document-text" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">
									Description
								</Text>
							</View>

							<Input
								className="min-h-[100px] rounded-lg border border-border bg-background p-3 text-foreground"
								value={formData.description}
								onChangeText={(v) => updateField("description", v)}
								placeholder="Décrivez votre lieu, son ambiance, son histoire..."
								placeholderTextColor="#666"
								multiline
								textAlignVertical="top"
							/>
						</View>

						{/* Images Section */}
						<View className="rounded-xl border border-border bg-card p-4">
							<View className="mb-4 flex-row items-center gap-2">
								<Ionicons name="image" size={20} color="#7c3aed" />
								<Text className="font-sans-bold text-foreground">Visuels</Text>
							</View>

							<View className="space-y-4">
								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										URL de la photo
									</Text>
									<Input
										className="rounded-lg border border-border bg-background p-3 text-foreground"
										value={formData.photoUrl}
										onChangeText={(v) => updateField("photoUrl", v)}
										placeholder="https://..."
										placeholderTextColor="#666"
										autoCapitalize="none"
										keyboardType="url"
									/>
								</View>

								<View>
									<Text className="mb-1 font-sans-medium text-foreground text-sm">
										URL du logo
									</Text>
									<Input
										className="rounded-lg border border-border bg-background p-3 text-foreground"
										value={formData.logoUrl}
										onChangeText={(v) => updateField("logoUrl", v)}
										placeholder="https://..."
										placeholderTextColor="#666"
										autoCapitalize="none"
										keyboardType="url"
									/>
								</View>
							</View>
						</View>

						{/* Save Button */}
						<TouchableOpacity
							className="flex-row items-center justify-center rounded-xl bg-primary p-4"
							onPress={handleSave}
							disabled={isSaving}
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
								{isSaving
									? "Enregistrement..."
									: isNewVenue
										? "Créer mon lieu"
										: "Enregistrer les modifications"}
							</Text>
						</TouchableOpacity>

						{/* Spacer for scroll */}
						<View className="h-8" />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Container>
	);
}
