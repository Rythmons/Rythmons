import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

function showError(error: unknown, fallback: string) {
	const message = error instanceof Error ? error.message : fallback;
	Alert.alert("Erreur", message);
}

export default function ProposeBookingScreen() {
	const params = useLocalSearchParams<{
		artistId?: string;
		venueId?: string;
	}>();
	const artistId = Array.isArray(params.artistId)
		? params.artistId[0]
		: params.artistId;
	const venueId = Array.isArray(params.venueId)
		? params.venueId[0]
		: params.venueId;
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const isArtistProposing = Boolean(venueId);

	const myArtistsQuery = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user) && Boolean(venueId),
	});
	const myVenuesQuery = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user) && Boolean(artistId),
	});

	const [selectedArtistId, setSelectedArtistId] = useState("");
	const [selectedVenueId, setSelectedVenueId] = useState("");
	const [proposedDate, setProposedDate] = useState("");
	const [proposedTime, setProposedTime] = useState("19:00");
	const [proposedFee, setProposedFee] = useState("");
	const [initialMessage, setInitialMessage] = useState("");

	useEffect(() => {
		if (isArtistProposing && myArtistsQuery.data?.length && !selectedArtistId) {
			setSelectedArtistId(myArtistsQuery.data[0].id);
		}
	}, [isArtistProposing, myArtistsQuery.data, selectedArtistId]);

	useEffect(() => {
		if (!isArtistProposing && myVenuesQuery.data?.length && !selectedVenueId) {
			setSelectedVenueId(myVenuesQuery.data[0].id);
		}
	}, [isArtistProposing, myVenuesQuery.data, selectedVenueId]);

	const effectiveArtistId = useMemo(
		() =>
			isArtistProposing
				? myArtistsQuery.data?.length === 1
					? myArtistsQuery.data[0].id
					: selectedArtistId
				: (artistId ?? ""),
		[artistId, isArtistProposing, myArtistsQuery.data, selectedArtistId],
	);

	const effectiveVenueId = useMemo(
		() =>
			isArtistProposing
				? (venueId ?? "")
				: myVenuesQuery.data?.length === 1
					? myVenuesQuery.data[0].id
					: selectedVenueId,
		[isArtistProposing, myVenuesQuery.data, selectedVenueId, venueId],
	);

	const createMutation = useMutation({
		...trpc.booking.create.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			Alert.alert("Succès", "Proposition envoyée.");
			router.replace("/(drawer)/bookings" as never);
		},
		onError: (error) =>
			showError(error, "Impossible d’envoyer la proposition."),
	});

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
					<Text className="text-center text-muted-foreground">
						Connectez-vous pour envoyer une proposition.
					</Text>
				</View>
			</Container>
		);
	}

	if (!artistId && !venueId) {
		return (
			<Container>
				<View className="flex-1 justify-center px-6">
					<Title className="text-center text-2xl text-foreground">
						Choisissez une fiche
					</Title>
					<Text className="mt-3 text-center text-muted-foreground">
						Ouvrez un artiste ou un lieu depuis la recherche pour démarrer une
						proposition de booking.
					</Text>
					<View className="mt-6 gap-3">
						<Button
							label="Aller à la recherche"
							onPress={() => router.replace("/(drawer)/search" as never)}
						/>
						<Button
							label="Voir mes bookings"
							variant="secondary"
							onPress={() => router.replace("/(drawer)/bookings" as never)}
						/>
					</View>
				</View>
			</Container>
		);
	}

	const canSubmit =
		Boolean(effectiveArtistId) &&
		Boolean(effectiveVenueId) &&
		proposedDate.trim().length > 0 &&
		proposedTime.trim().length > 0;

	return (
		<Container>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
			>
				<Button
					label="Retour"
					variant="ghost"
					className="self-start px-0"
					textClassName="text-primary"
					onPress={() => router.back()}
				/>

				<View className="gap-2">
					<Title className="text-3xl text-foreground">
						Proposer un booking
					</Title>
					<Text className="text-muted-foreground">
						Saisissez une date, un message et, côté lieu, un cachet initial si
						besoin.
					</Text>
				</View>

				{isArtistProposing && (myArtistsQuery.data?.length ?? 0) > 1 ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Profil artiste expéditeur
						</Text>
						<View className="mt-3 gap-2">
							{myArtistsQuery.data?.map((artist) => (
								<Button
									key={artist.id}
									label={artist.stageName}
									variant={
										(selectedArtistId || myArtistsQuery.data?.[0]?.id) ===
										artist.id
											? "primary"
											: "secondary"
									}
									onPress={() => setSelectedArtistId(artist.id)}
								/>
							))}
						</View>
					</Card>
				) : null}

				{!isArtistProposing && (myVenuesQuery.data?.length ?? 0) > 1 ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Lieu expéditeur
						</Text>
						<View className="mt-3 gap-2">
							{myVenuesQuery.data?.map((venue) => (
								<Button
									key={venue.id}
									label={venue.name}
									variant={
										(selectedVenueId || myVenuesQuery.data?.[0]?.id) ===
										venue.id
											? "primary"
											: "secondary"
									}
									onPress={() => setSelectedVenueId(venue.id)}
								/>
							))}
						</View>
					</Card>
				) : null}

				<Card>
					<Text className="font-sans-bold text-foreground">Date et heure</Text>
					<Input
						className="mt-3"
						value={proposedDate}
						onChangeText={setProposedDate}
						placeholder="YYYY-MM-DD"
						placeholderTextColor="#666"
					/>
					<Input
						className="mt-3"
						value={proposedTime}
						onChangeText={setProposedTime}
						placeholder="19:00"
						placeholderTextColor="#666"
					/>
				</Card>

				{!isArtistProposing ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Cachet proposé (€)
						</Text>
						<Input
							className="mt-3"
							value={proposedFee}
							onChangeText={setProposedFee}
							placeholder="Optionnel"
							placeholderTextColor="#666"
							keyboardType="numeric"
						/>
					</Card>
				) : null}

				<Card>
					<Text className="font-sans-bold text-foreground">Message</Text>
					<Input
						className="mt-3 min-h-28"
						multiline
						textAlignVertical="top"
						value={initialMessage}
						onChangeText={setInitialMessage}
						placeholder="Présentez votre proposition..."
						placeholderTextColor="#666"
						maxLength={2000}
					/>
				</Card>

				<View className="gap-3">
					<Button
						label="Envoyer la proposition"
						loading={createMutation.isPending}
						disabled={!canSubmit}
						onPress={() => {
							const proposedDateTime = new Date(
								`${proposedDate.trim()}T${proposedTime.trim()}:00`,
							);
							if (Number.isNaN(proposedDateTime.getTime())) {
								Alert.alert(
									"Date invalide",
									"Utilisez le format YYYY-MM-DD et une heure valide.",
								);
								return;
							}
							createMutation.mutate({
								artistId: effectiveArtistId,
								venueId: effectiveVenueId,
								proposedDate: proposedDateTime,
								proposedFee: proposedFee.trim()
									? Number.parseInt(proposedFee, 10)
									: undefined,
								initialMessage: initialMessage.trim() || undefined,
							});
						}}
					/>
					<Button
						label="Annuler"
						variant="secondary"
						onPress={() => router.replace("/(drawer)/bookings" as never)}
					/>
				</View>
			</ScrollView>
		</Container>
	);
}
