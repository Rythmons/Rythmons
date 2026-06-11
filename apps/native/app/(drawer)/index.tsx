import type { AppRouter } from "@rythmons/api";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type ArtistMenuItem =
	inferRouterOutputs<AppRouter>["artist"]["myArtists"][number];
type VenueMenuItem =
	inferRouterOutputs<AppRouter>["venue"]["getMyVenues"][number];

export default function Home() {
	const { data: session } = authClient.useSession();
	const sessionRole = (
		session?.user as
			| {
					role?: "ARTIST" | "ORGANIZER" | "BOTH" | null;
			  }
			| undefined
	)?.role;
	const hasArtistRole = sessionRole === "ARTIST" || sessionRole === "BOTH";
	const hasOrganizerRole =
		sessionRole === "ORGANIZER" || sessionRole === "BOTH";
	const { data: artists } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user) && !hasArtistRole,
	});
	const { data: venues } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user) && !hasOrganizerRole,
	});
	const canSearchVenues =
		hasArtistRole || ((artists ?? []) as ArtistMenuItem[]).length > 0;
	const canSearchArtists =
		hasOrganizerRole || ((venues ?? []) as VenueMenuItem[]).length > 0;
	const canUseSearch = canSearchVenues || canSearchArtists;

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
				<View className="mb-6 gap-2">
					<Title className="text-4xl text-foreground tracking-tight">
						RYTHMONS !
					</Title>
					<Text className="font-sans-bold text-primary text-sm uppercase tracking-widest">
						Par les indés, pour les indés
					</Text>
					<Text className="text-base text-muted-foreground leading-6">
						La plateforme de booking qui simplifie la rencontre entre les
						artistes locaux et les lieux de diffusion.
					</Text>
				</View>

				<Card className="mb-6 overflow-hidden">
					<View className="gap-3">
						<Title className="text-foreground text-xl">
							Explore artistes & lieux
						</Title>
						<Text className="text-muted-foreground text-sm leading-6">
							Parcourez les profils disponibles, puis proposez une date en
							quelques taps.
						</Text>
						<View className="gap-3">
							{session?.user ? (
								canUseSearch ? (
									<Button
										label="Ouvrir la recherche"
										onPress={() => router.push("/(drawer)/search" as never)}
									/>
								) : (
									<>
										<Button
											label="Completer mon profil"
											onPress={() => router.push("/(drawer)/profile" as never)}
										/>
										<Button
											label="Creer un artiste"
											variant="secondary"
											onPress={() =>
												router.push("/(drawer)/artist/new" as never)
											}
										/>
									</>
								)
							) : (
								<Button
									label="Aller a Connexion"
									onPress={() => router.push("/(drawer)/login" as never)}
								/>
							)}
						</View>
					</View>
				</Card>

				{session?.user ? (
					<Card className="mb-6">
						<Text className="font-sans-medium text-primary text-sm">
							Mon compte
						</Text>
						<Title className="mt-1 text-2xl text-foreground">
							Bienvenue, {session.user.name}
						</Title>
						<Text className="mt-1 text-base text-muted-foreground">
							{session.user.email}
						</Text>
						<Text className="mt-4 text-muted-foreground text-sm leading-6">
							Retrouvez vos informations de compte, votre role et les actions de
							session depuis la page profil.
						</Text>
						<View className="mt-4 gap-3">
							<Button
								label="Ouvrir mon profil"
								onPress={() => router.push("/(drawer)/profile" as never)}
							/>
						</View>
					</Card>
				) : null}

				{session?.user ? (
					<Card className="mb-6">
						<Title className="mb-1 text-foreground text-xl">Mes profils</Title>
						<Text className="mb-4 text-muted-foreground text-sm">
							Accedez a vos artistes et a vos lieux sans surcharger la barre de
							navigation mobile.
						</Text>
						<View className="gap-3">
							<Button
								label="Gerer mes artistes"
								variant="secondary"
								onPress={() => router.push("/(drawer)/artist" as never)}
							/>
							<Button
								label="Gerer mes lieux"
								variant="secondary"
								onPress={() => router.push("/(drawer)/venue" as never)}
							/>
						</View>
					</Card>
				) : null}

				{session?.user ? (
					<Card className="mb-6">
						<Title className="mb-1 text-foreground text-xl">Mon planning</Title>
						<Text className="mb-4 text-muted-foreground text-sm">
							Retrouvez rapidement vos bookings, votre calendrier et vos
							prochaines actions.
						</Text>
						<View className="gap-3">
							<Button
								label="Ouvrir mes bookings"
								onPress={() => router.push("/(drawer)/bookings" as never)}
							/>
							<Button
								label="Gerer mon calendrier"
								variant="secondary"
								onPress={() => router.push("/(drawer)/calendar" as never)}
							/>
						</View>
					</Card>
				) : null}

				{/* No extra CTA card when logged out; handled above */}
			</ScrollView>
		</Container>
	);
}
