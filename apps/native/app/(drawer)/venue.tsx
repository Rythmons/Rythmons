import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
	ActivityIndicator,
	Image,
	RefreshControl,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

export default function VenueListScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();

	const {
		data: venues = [],
		isLoading,
		refetch,
		isFetching,
	} = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user),
	});

	if (sessionPending || isLoading) {
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
					<Title className="mb-2 text-2xl">Mes lieux</Title>
					<Text className="mb-4 text-center text-muted-foreground">
						Vous devez être connecté pour gérer vos lieux.
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
			<ScrollView
				className="flex-1 p-4"
				refreshControl={
					<RefreshControl
						refreshing={isFetching && !isLoading}
						onRefresh={() => refetch()}
					/>
				}
			>
				<View className="mb-6 flex-row items-center justify-between">
					<View className="flex-1 pr-3">
						<Title className="text-2xl text-foreground">Mes lieux</Title>
						<Text className="text-muted-foreground">
							Gérez les établissements que vous représentez.
						</Text>
					</View>

					<TouchableOpacity
						className="rounded-xl bg-primary p-3"
						onPress={() =>
							router.push({
								pathname: "/(drawer)/venue/new",
								params: { backTo: "/(drawer)/venue" },
							} as never)
						}
					>
						<Ionicons name="add" size={22} color="white" />
					</TouchableOpacity>
				</View>

				{venues.length === 0 ? (
					<View className="rounded-xl border border-border bg-card p-4">
						<Text className="mb-2 font-sans-bold text-foreground">
							Aucun lieu pour le moment
						</Text>
						<Text className="mb-4 text-muted-foreground">
							Créez votre première fiche de lieu pour rechercher des artistes.
						</Text>
						<TouchableOpacity
							className="flex-row items-center justify-center rounded-lg bg-primary p-3"
							onPress={() =>
								router.push({
									pathname: "/(drawer)/venue/new",
									params: { backTo: "/(drawer)/venue" },
								} as never)
							}
						>
							<Ionicons
								name="business"
								size={18}
								color="white"
								style={{ marginRight: 8 }}
							/>
							<Text className="font-sans-bold text-primary-foreground">
								Créer un lieu
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View className="space-y-3">
						{venues.map((venue) => (
							<TouchableOpacity
								key={venue.id}
								className="overflow-hidden rounded-xl border border-border bg-card"
								onPress={() =>
									router.push({
										pathname: "/(drawer)/venue/[id]",
										params: { id: venue.id, backTo: "/(drawer)/venue" },
									} as never)
								}
							>
								{venue.photoUrl ? (
									<Image
										source={{ uri: venue.photoUrl }}
										className="h-24 w-full"
										resizeMode="cover"
									/>
								) : (
									<View className="h-24 w-full bg-primary/10" />
								)}

								<View className="p-4">
									<View className="flex-row items-center gap-3">
										{venue.logoUrl ? (
											<Image
												source={{ uri: venue.logoUrl }}
												className="h-12 w-12 rounded-full border border-border"
											/>
										) : (
											<View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
												<Ionicons name="business" size={22} color="#7c3aed" />
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
								</View>
							</TouchableOpacity>
						))}
					</View>
				)}

				<View className="h-8" />
			</ScrollView>
		</Container>
	);
}
