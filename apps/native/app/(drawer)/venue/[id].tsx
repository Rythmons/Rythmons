import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
	ActivityIndicator,
	Alert,
	Image,
	Linking,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { Text, Title } from "@/components/ui/typography";
import { VenueMap } from "@/components/ui/venue-map";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

export default function VenueProfileScreen() {
	const params = useLocalSearchParams<{ id: string }>();
	const venueId = Array.isArray(params.id) ? params.id[0] : params.id;

	const { data: session } = authClient.useSession();

	const { data: venue, isLoading } = useQuery({
		...trpc.venue.getById.queryOptions({ id: venueId ?? "" }),
		enabled: Boolean(venueId),
	});

	const isOwner =
		Boolean(session?.user) &&
		Boolean(venue?.owner?.id) &&
		session?.user.id === venue?.owner.id;

	const openMaps = async () => {
		if (!venue) return;
		const query = encodeURIComponent(
			`${venue.address}, ${venue.postalCode} ${venue.city}, ${venue.country}`,
		);
		const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
		try {
			await Linking.openURL(url);
		} catch {
			Alert.alert("Erreur", "Impossible d’ouvrir la carte.");
		}
	};

	if (!venueId) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Text className="text-center text-muted-foreground">
						Identifiant de lieu manquant.
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

	if (!venue) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Title className="mb-2 text-2xl">Lieu introuvable</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Ce lieu n’existe pas ou n’est plus disponible.
					</Text>
					<TouchableOpacity
						className="rounded-lg bg-primary px-4 py-2"
						onPress={() => router.replace("/venue")}
					>
						<Text className="font-sans-medium text-primary-foreground">
							Retour
						</Text>
					</TouchableOpacity>
				</View>
			</Container>
		);
	}

	const genreLabel =
		venue.genres?.length > 0
			? venue.genres.map((g) => g.name).join(" • ")
			: null;

	return (
		<Container>
			<ScrollView className="flex-1">
				{venue.photoUrl ? (
					<Image
						source={{ uri: venue.photoUrl }}
						className="h-44 w-full"
						resizeMode="cover"
					/>
				) : (
					<View className="h-44 w-full bg-primary/10" />
				)}

				<View className="-mt-10 px-4">
					<View className="rounded-2xl border border-border bg-card p-4">
						<View className="flex-row items-center gap-3">
							{venue.logoUrl ? (
								<Image
									source={{ uri: venue.logoUrl }}
									className="h-16 w-16 rounded-2xl border border-border"
								/>
							) : (
								<View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
									<Ionicons name="business" size={28} color="#7c3aed" />
								</View>
							)}

							<View className="flex-1">
								<Title className="text-2xl text-foreground">{venue.name}</Title>
								<Text className="text-muted-foreground">
									{venue.city} • {getVenueTypeLabel(venue.venueType)}
								</Text>
								{venue.capacity ? (
									<Text className="text-muted-foreground text-sm">
										Capacité: {venue.capacity} pers.
									</Text>
								) : null}
							</View>
						</View>

						{genreLabel ? (
							<View className="mt-4 rounded-lg border border-border bg-background px-3 py-3">
								<Text className="font-sans-medium text-foreground text-sm">
									Genres
								</Text>
								<Text className="mt-1 text-muted-foreground">{genreLabel}</Text>
							</View>
						) : null}

						<View className="mt-4 rounded-lg border border-border bg-background px-3 py-3">
							<Text className="font-sans-medium text-foreground text-sm">
								Adresse
							</Text>
							<Text className="mt-1 text-muted-foreground">
								{venue.address}, {venue.postalCode} {venue.city},{" "}
								{venue.country}
							</Text>

							<View className="mt-3">
								<VenueMap
									address={venue.address}
									city={venue.city}
									onPress={openMaps}
								/>
							</View>
							<TouchableOpacity
								className="mt-3 flex-row items-center self-start rounded-lg border border-border bg-background px-3 py-2"
								onPress={openMaps}
							>
								<Ionicons
									name="map-outline"
									size={18}
									color="#9ca3af"
									style={{ marginRight: 8 }}
								/>
								<Text className="text-muted-foreground">Ouvrir la carte</Text>
							</TouchableOpacity>
						</View>

						{venue.description ? (
							<View className="mt-4 rounded-lg border border-border bg-background px-3 py-3">
								<Text className="font-sans-medium text-foreground text-sm">
									Description
								</Text>
								<Text className="mt-1 text-muted-foreground">
									{venue.description}
								</Text>
							</View>
						) : null}

						{venue.images?.length ? (
							<View className="mt-4 rounded-lg border border-border bg-background px-3 py-3">
								<Text className="font-sans-medium text-foreground text-sm">
									Galerie
								</Text>
								<ScrollView
									horizontal
									className="mt-3"
									showsHorizontalScrollIndicator={false}
								>
									<View className="flex-row gap-3">
										{venue.images.map((url) => (
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

						{isOwner ? (
							<TouchableOpacity
								className="mt-6 flex-row items-center justify-center rounded-xl bg-primary p-4"
								onPress={() => router.push("/venue")}
							>
								<Ionicons
									name="create-outline"
									size={20}
									color="white"
									style={{ marginRight: 8 }}
								/>
								<Text className="font-sans-bold text-primary-foreground">
									Modifier mon lieu
								</Text>
							</TouchableOpacity>
						) : null}
					</View>

					<View className="h-8" />
				</View>
			</ScrollView>
		</Container>
	);
}
