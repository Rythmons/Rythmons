import { Ionicons } from "@expo/vector-icons";
import type { AppRouter } from "@rythmons/api";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Image,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

type SearchVenueItem = inferRouterOutputs<AppRouter>["venue"]["search"][number];

type ArtistListItem = {
	id: string;
};

export default function VenueSearchScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [search, setSearch] = useState("");
	const normalizedQuery = useMemo(() => search.trim(), [search]);
	const sessionRole = (
		session?.user as { role?: "ARTIST" | "BOTH" | null } | undefined
	)?.role;
	const hasArtistRole = sessionRole === "ARTIST" || sessionRole === "BOTH";

	const artistsQuery = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user) && !hasArtistRole,
	});

	const artistItems = (artistsQuery.data ?? []) as ArtistListItem[];
	const canSearchVenues = hasArtistRole || artistItems.length > 0;

	const venueSearchQuery = useQuery({
		...trpc.venue.search.queryOptions({
			query: normalizedQuery,
		}),
		enabled: Boolean(session?.user) && canSearchVenues,
	});

	const venues = (venueSearchQuery.data ?? []) as SearchVenueItem[];

	if (
		sessionPending ||
		(session?.user && !hasArtistRole && artistsQuery.isLoading)
	) {
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
				<View className="flex-1 items-center justify-center px-6">
					<Title className="mb-2 text-center text-2xl">
						Rechercher des lieux
					</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Connectez-vous pour rechercher des lieux et organisateurs.
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

	if (!canSearchVenues) {
		return (
			<Container>
				<View className="flex-1 justify-center px-6">
					<Title className="mb-2 text-center text-2xl">
						Fonction reservee aux artistes
					</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Pour rechercher des lieux, renseignez un role artiste ou creez un
						profil artiste.
					</Text>
					<View className="flex-row gap-3">
						<TouchableOpacity
							className="flex-1 rounded-lg border border-border bg-card px-4 py-3"
							onPress={() => router.push("/(drawer)/profile")}
						>
							<Text className="text-center font-sans-medium text-foreground">
								Mon profil
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className="flex-1 rounded-lg bg-primary px-4 py-3"
							onPress={() => router.push("/(drawer)/artist/new")}
						>
							<Text className="text-center font-sans-medium text-primary-foreground">
								Creer un artiste
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Container>
		);
	}

	return (
		<Container>
			<ScrollView className="flex-1 p-4">
				<View className="mb-6">
					<Title className="text-2xl text-foreground">
						Rechercher des lieux
					</Title>
					<Text className="mt-1 text-muted-foreground">
						Trouvez des lieux et organisateurs deja presents sur Rythmons.
					</Text>
				</View>

				<View className="mb-4 rounded-xl border border-border bg-card p-4">
					<Text className="mb-2 font-sans-medium text-foreground">
						Recherche
					</Text>
					<View className="flex-row items-center rounded-lg border border-border bg-background px-3">
						<Ionicons name="search-outline" size={18} color="#9ca3af" />
						<Input
							className="flex-1 px-3 py-3 text-foreground"
							value={search}
							onChangeText={setSearch}
							placeholder="Nom, ville, code postal, genre..."
							placeholderTextColor="#9ca3af"
							autoCapitalize="none"
							autoCorrect={false}
						/>
					</View>
					<Text className="mt-2 text-muted-foreground text-xs">
						Recherche par nom de lieu, ville, code postal, organisateur ou
						genre.
					</Text>
				</View>

				<View className="mb-4 flex-row items-center justify-between">
					<Text className="text-muted-foreground text-sm">
						{normalizedQuery
							? `${venues.length} resultat(s) pour "${normalizedQuery}"`
							: `${venues.length} lieu(x) disponible(s)`}
					</Text>
					{venueSearchQuery.isFetching && !venueSearchQuery.isLoading ? (
						<Text className="text-muted-foreground text-xs">
							Mise a jour...
						</Text>
					) : null}
				</View>

				{venueSearchQuery.isLoading ? (
					<View className="rounded-xl border border-border bg-card p-6">
						<ActivityIndicator size="large" />
						<Text className="mt-3 text-center text-muted-foreground">
							Chargement des lieux...
						</Text>
					</View>
				) : venueSearchQuery.isError ? (
					<View className="rounded-xl border border-destructive/30 bg-card p-4">
						<Text className="font-sans-medium text-destructive">
							Impossible de charger les lieux.
						</Text>
						<Text className="mt-1 text-muted-foreground">
							Verifiez votre connexion puis reessayez.
						</Text>
					</View>
				) : venues.length === 0 ? (
					<View className="rounded-xl border border-border bg-card p-4">
						<Text className="font-sans-bold text-foreground">
							Aucun lieu trouve pour ces criteres
						</Text>
						<Text className="mt-2 text-muted-foreground">
							Essayez une autre ville, un genre ou le nom d&apos;un
							organisateur.
						</Text>
					</View>
				) : (
					<View className="gap-3">
						{venues.map((venue) => {
							const genreLabel = venue.genres.length
								? venue.genres.map((genre) => genre.name).join(" • ")
								: "Genres non renseignes";

							return (
								<TouchableOpacity
									key={venue.id}
									className="overflow-hidden rounded-xl border border-border bg-card"
									onPress={() =>
										router.push({
											pathname: "/(drawer)/venue/[id]",
											params: { id: venue.id },
										})
									}
								>
									{venue.photoUrl ? (
										<Image
											source={{ uri: venue.photoUrl }}
											className="h-28 w-full"
											resizeMode="cover"
										/>
									) : (
										<View className="h-28 w-full bg-primary/10" />
									)}

									<View className="p-4">
										<View className="mb-3 flex-row items-center gap-3">
											{venue.logoUrl ? (
												<Image
													source={{ uri: venue.logoUrl }}
													className="h-12 w-12 rounded-lg border border-border"
												/>
											) : (
												<View className="h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
													<Ionicons
														name="business-outline"
														size={22}
														color="#7c3aed"
													/>
												</View>
											)}

											<View className="flex-1">
												<Title className="text-foreground text-lg">
													{venue.name}
												</Title>
												<Text className="text-muted-foreground text-sm">
													{venue.city} • {getVenueTypeLabel(venue.venueType)}
												</Text>
											</View>

											<Ionicons
												name="chevron-forward"
												size={18}
												color="#9ca3af"
											/>
										</View>

										<Text className="mb-2 text-muted-foreground text-sm">
											Organisateur : {venue.owner.name}
										</Text>
										<Text className="mb-2 text-muted-foreground text-sm">
											{genreLabel}
										</Text>
										<Text className="text-muted-foreground" numberOfLines={3}>
											{venue.description ||
												"Aucune description n'a encore ete ajoutee pour ce lieu."}
										</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>
				)}

				<View className="h-8" />
			</ScrollView>
		</Container>
	);
}
