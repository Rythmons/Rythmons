import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
	ActivityIndicator,
	Image,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type ArtistListItem = {
	id: string;
	stageName: string;
	bannerUrl: string | null;
	photoUrl: string | null;
	bio: string | null;
	genres?: Array<{ name: string }>;
};

export default function ArtistListScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();

	const artistsQuery = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user),
	});
	const artists = (artistsQuery.data ?? []) as ArtistListItem[];

	if (sessionPending || artistsQuery.isLoading) {
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
					<Title className="mb-2 text-2xl">Mes artistes</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Vous devez être connecté pour gérer vos profils d’artistes.
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
				<View className="mb-6 flex-row items-center justify-between">
					<View className="flex-1 pr-3">
						<Title className="text-2xl text-foreground">Mes artistes</Title>
						<Text className="text-muted-foreground">
							Créez et mettez à jour vos profils publics.
						</Text>
					</View>

					<TouchableOpacity
						className="rounded-xl bg-primary p-3"
						onPress={() =>
							router.push({
								pathname: "/(drawer)/artist/new",
								params: { backTo: "/(drawer)/artist" },
							} as never)
						}
					>
						<Ionicons name="add" size={22} color="white" />
					</TouchableOpacity>
				</View>

				{artists.length === 0 ? (
					<View className="rounded-xl border border-border bg-card p-4">
						<Text className="mb-2 font-sans-bold text-foreground">
							Aucun artiste pour le moment
						</Text>
						<Text className="mb-4 text-muted-foreground">
							Créez votre premier profil d’artiste pour recevoir des demandes et
							être visible.
						</Text>
						<TouchableOpacity
							className="flex-row items-center justify-center rounded-lg bg-primary p-3"
							onPress={() =>
								router.push({
									pathname: "/(drawer)/artist/new",
									params: { backTo: "/(drawer)/artist" },
								} as never)
							}
						>
							<Ionicons
								name="create-outline"
								size={18}
								color="white"
								style={{ marginRight: 8 }}
							/>
							<Text className="font-sans-bold text-primary-foreground">
								Créer un artiste
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View className="space-y-3">
						{artists.map((artist) => {
							const genreLabel = artist.genres?.length
								? artist.genres.map((g) => g.name).join(" • ")
								: null;

							return (
								<TouchableOpacity
									key={artist.id}
									className="overflow-hidden rounded-xl border border-border bg-card"
									onPress={() =>
										router.push({
											pathname: "/(drawer)/artist/[id]",
											params: { id: artist.id, backTo: "/(drawer)/artist" },
										} as never)
									}
								>
									{artist.bannerUrl ? (
										<Image
											source={{ uri: artist.bannerUrl }}
											className="h-24 w-full"
											resizeMode="cover"
										/>
									) : null}

									<View className="p-4">
										<View className="flex-row items-center gap-3">
											{artist.photoUrl ? (
												<Image
													source={{ uri: artist.photoUrl }}
													className="h-12 w-12 rounded-full border border-border"
												/>
											) : (
												<View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
													<Ionicons name="person" size={22} color="#7c3aed" />
												</View>
											)}

											<View className="flex-1">
												<Title className="text-foreground text-lg">
													{artist.stageName}
												</Title>
												{genreLabel ? (
													<Text className="text-muted-foreground text-sm">
														{genreLabel}
													</Text>
												) : null}
											</View>

											<Ionicons
												name="chevron-forward"
												size={18}
												color="#9ca3af"
											/>
										</View>

										{artist.bio ? (
											<Text
												className="mt-3 text-muted-foreground"
												numberOfLines={2}
											>
												{artist.bio}
											</Text>
										) : null}
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
