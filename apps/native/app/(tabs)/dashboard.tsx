import type { AppRouter } from "@rythmons/api";
import { useQuery } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { TRPCQueryKey } from "@trpc/tanstack-react-query";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { Loader } from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import { useSignOut } from "@/lib/use-sign-out";
import { trpc } from "@/utils/trpc";

type PrivateDataResponse = inferRouterOutputs<AppRouter>["privateData"];

type VenueListItem = {
	id: string;
	name: string;
	city: string;
};

type ArtistListItem = {
	id: string;
	stageName: string;
	genres?: Array<{ name: string }>;
};

export default function DashboardScreen() {
	const { data: session, isPending } = authClient.useSession();

	const privateDataQuery = useQuery<
		PrivateDataResponse,
		TRPCClientErrorLike<AppRouter>,
		PrivateDataResponse,
		TRPCQueryKey
	>(
		trpc.privateData.queryOptions(undefined, {
			enabled: Boolean(session?.user),
			refetchOnMount: "always",
		}),
	);

	const venuesQuery = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user),
	});

	const artistsQuery = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user),
	});

	const { signOut, isSigningOut } = useSignOut();

	if (isPending) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Loader label="Chargement de la session…" />
				</View>
			</Container>
		);
	}

	if (!session?.user) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Text className="mb-2 text-center font-semibold text-2xl text-foreground">
						Tableau de bord
					</Text>
					<Text className="text-center text-muted-foreground">
						Connectez-vous ou créez un compte depuis l’onglet Accueil pour
						consulter vos informations privées.
					</Text>
				</View>
			</Container>
		);
	}

	const displayName =
		session.user.name ?? session.user.email ?? "Utilisateur Rythmons";

	const venues = (venuesQuery.data ?? []) as VenueListItem[];
	const artists = (artistsQuery.data ?? []) as ArtistListItem[];

	return (
		<Container>
			<ScrollView className="flex-1">
				<View className="gap-6 px-4 py-8">
					<View className="rounded-lg border border-border bg-card p-4">
						<Text className="mb-1 font-semibold text-foreground text-lg">
							Bienvenue, {displayName}
						</Text>
						{session.user.email ? (
							<Text className="text-muted-foreground text-sm">
								{session.user.email}
							</Text>
						) : null}
					</View>

					<View className="rounded-lg border border-border bg-card p-4">
						<Text className="mb-2 font-medium text-foreground">
							Message privé de l’API
						</Text>
						{privateDataQuery.isLoading ? (
							<Loader label="Récupération en cours…" size="small" />
						) : privateDataQuery.isError ? (
							<Text className="text-destructive text-sm">
								Impossible de charger le message confidentiel. Vérifiez votre
								connexion.
							</Text>
						) : (
							<Text className="text-muted-foreground">
								{privateDataQuery.data?.message ?? ""}
							</Text>
						)}
					</View>

					<View className="rounded-lg border border-border bg-card p-4">
						<View className="mb-3 flex-row items-center justify-between">
							<Text className="font-medium text-foreground">Mes lieux</Text>
							<TouchableOpacity
								className="rounded-md bg-primary px-3 py-2"
								onPress={() => router.push("/venue")}
							>
								<Text className="font-medium text-primary-foreground">
									{venues.length ? "Gérer" : "Créer"}
								</Text>
							</TouchableOpacity>
						</View>

						{venuesQuery.isLoading ? (
							<Loader label="Chargement…" size="small" />
						) : venuesQuery.isError ? (
							<Text className="text-destructive text-sm">
								Impossible de charger vos lieux.
							</Text>
						) : venues.length ? (
							<View className="gap-3">
								{venues.map((venue) => (
									<TouchableOpacity
										key={venue.id}
										className="rounded-md border border-border bg-background p-3"
										onPress={() => router.push(`/venue/${venue.id}`)}
									>
										<Text className="font-medium text-foreground">
											{venue.name}
										</Text>
										<Text className="text-muted-foreground text-sm">
											{venue.city}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						) : (
							<Text className="text-muted-foreground text-sm">
								Vous n’avez pas encore créé de lieu.
							</Text>
						)}
					</View>

					<View className="rounded-lg border border-border bg-card p-4">
						<View className="mb-3 flex-row items-center justify-between">
							<Text className="font-medium text-foreground">Mes artistes</Text>
							<TouchableOpacity
								className="rounded-md bg-primary px-3 py-2"
								onPress={() => router.push("/artist/new")}
							>
								<Text className="font-medium text-primary-foreground">
									Créer
								</Text>
							</TouchableOpacity>
						</View>

						{artistsQuery.isLoading ? (
							<Loader label="Chargement…" size="small" />
						) : artistsQuery.isError ? (
							<Text className="text-destructive text-sm">
								Impossible de charger vos artistes.
							</Text>
						) : artists.length ? (
							<View className="gap-3">
								{artists.map((artist) => (
									<TouchableOpacity
										key={artist.id}
										className="rounded-md border border-border bg-background p-3"
										onPress={() => router.push(`/artist/${artist.id}`)}
									>
										<Text className="font-medium text-foreground">
											{artist.stageName}
										</Text>
										<Text
											className="text-muted-foreground text-sm"
											numberOfLines={1}
										>
											{artist.genres?.length
												? artist.genres.map((g) => g.name).join(" • ")
												: "Aucun genre"}
										</Text>
									</TouchableOpacity>
								))}

								<TouchableOpacity
									className="self-start rounded-md border border-border px-4 py-2"
									onPress={() => router.push("/artist")}
								>
									<Text className="font-medium text-foreground">
										Voir tous mes artistes
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							<Text className="text-muted-foreground text-sm">
								Vous n’avez pas encore créé d’artiste.
							</Text>
						)}
					</View>

					<View className="rounded-lg border border-border bg-card p-4">
						<Text className="mb-2 font-medium text-foreground">
							Gestion de session
						</Text>
						<Text className="mb-4 text-muted-foreground">
							Vous pouvez vous déconnecter pour changer de compte.
						</Text>
						<TouchableOpacity
							onPress={signOut}
							disabled={isSigningOut}
							className="self-start rounded-md bg-destructive px-4 py-2 disabled:opacity-70"
						>
							<Text className="font-medium text-destructive-foreground">
								{isSigningOut ? "Déconnexion…" : "Se déconnecter"}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</Container>
	);
}
