import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, View } from "react-native";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KeyboardFormScreen } from "@/components/ui/keyboard-form-screen";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

const STATUS_LABELS = {
	PENDING: "En attente",
	ACCEPTED: "Acceptée",
	REFUSED: "Refusée",
	CANCELLED: "Annulée",
} as const;

function showError(error: unknown, fallback: string) {
	const message = error instanceof Error ? error.message : fallback;
	Alert.alert("Erreur", message);
}

export default function BookingDetailScreen() {
	const params = useLocalSearchParams<{ id: string }>();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [refusalReason, setRefusalReason] = useState("");

	const bookingQuery = useQuery({
		...trpc.booking.getById.queryOptions({ id: id ?? "" }),
		enabled: Boolean(session?.user) && Boolean(id),
	});

	const acceptMutation = useMutation({
		...trpc.booking.accept.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			Alert.alert("Succès", "Proposition acceptée.");
			router.replace("/(drawer)/bookings" as never);
		},
		onError: (error) =>
			showError(error, "Impossible d’accepter la proposition."),
	});

	const refuseMutation = useMutation({
		...trpc.booking.refuse.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			Alert.alert("Succès", "Proposition refusée.");
			router.replace("/(drawer)/bookings" as never);
		},
		onError: (error) =>
			showError(error, "Impossible de refuser la proposition."),
	});

	const cancelMutation = useMutation({
		...trpc.booking.cancel.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			Alert.alert("Succès", "Proposition annulée.");
			router.replace("/(drawer)/bookings" as never);
		},
		onError: (error) =>
			showError(error, "Impossible d’annuler la proposition."),
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
						Connectez-vous pour ouvrir cette proposition.
					</Text>
				</View>
			</Container>
		);
	}

	if (!id) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Text className="text-center text-muted-foreground">
						Identifiant de booking manquant.
					</Text>
				</View>
			</Container>
		);
	}

	const booking = bookingQuery.data;

	if (bookingQuery.isLoading || !booking) {
		return (
			<Container>
				<View
					className="flex-1"
					style={{
						justifyContent: "center",
						padding: 24,
					}}
				>
					{bookingQuery.isError ? (
						<Text className="text-center text-destructive">
							{bookingQuery.error.message}
						</Text>
					) : (
						<ActivityIndicator size="large" />
					)}
				</View>
			</Container>
		);
	}

	const isCreator = booking.createdByUserId === session.user.id;
	const canAccept =
		!isCreator &&
		booking.status === "PENDING" &&
		(booking.artist.userId === session.user.id ||
			booking.venue.ownerId === session.user.id);
	const canRefuse = canAccept;
	const canCancel = isCreator && booking.status === "PENDING";

	return (
		<Container>
			<KeyboardFormScreen bottomInsetOffset={96}>
				<Button
					label="Retour aux bookings"
					variant="ghost"
					className="self-start px-0"
					textClassName="text-primary"
					onPress={() => router.replace("/(drawer)/bookings" as never)}
				/>

				<View className="gap-2">
					<Title className="text-3xl text-foreground">Détail du booking</Title>
					<View className="self-start rounded-full bg-muted px-3 py-1">
						<Text className="font-sans-medium text-sm">
							{STATUS_LABELS[booking.status]}
						</Text>
					</View>
				</View>

				<Card>
					<Text className="font-sans-bold text-foreground">Date proposée</Text>
					<Text className="mt-2 text-muted-foreground">
						{new Date(booking.proposedDate).toLocaleString("fr-FR", {
							dateStyle: "long",
							timeStyle: "short",
						})}
					</Text>
					{booking.proposedFee != null ? (
						<Text className="mt-2 text-muted-foreground">
							Cachet proposé: {booking.proposedFee} €
						</Text>
					) : null}
				</Card>

				<Card>
					<Text className="font-sans-bold text-foreground">Participants</Text>
					<Text className="mt-2 text-muted-foreground">
						Initiateur:{" "}
						{isCreator ? "Vous" : (booking.createdBy?.name ?? "Autre")}
					</Text>
					<Text className="mt-2 text-muted-foreground">
						Artiste: {booking.artist.stageName}
					</Text>
					<Text className="mt-1 text-muted-foreground">
						Lieu: {booking.venue.name}
					</Text>
				</Card>

				{booking.initialMessage ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Message initial
						</Text>
						<Text className="mt-2 text-muted-foreground">
							{booking.initialMessage}
						</Text>
					</Card>
				) : null}

				{booking.refusalReason ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Motif du refus
						</Text>
						<Text className="mt-2 text-muted-foreground">
							{booking.refusalReason}
						</Text>
					</Card>
				) : null}

				{booking.status === "ACCEPTED" ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Booking confirmé
						</Text>
						<Text className="mt-2 text-muted-foreground">
							Contact artiste: {booking.artist.user?.email ?? "—"}
						</Text>
						<Text className="mt-1 text-muted-foreground">
							Contact lieu: {booking.venue.owner?.email ?? "—"}
						</Text>
						{booking.artist.techRequirements ? (
							<Text className="mt-2 text-muted-foreground">
								Fiche tech: {booking.artist.techRequirements}
							</Text>
						) : null}
					</Card>
				) : null}

				{canRefuse ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Motif du refus
						</Text>
						<Input
							className="mt-3"
							multiline
							value={refusalReason}
							onChangeText={setRefusalReason}
							placeholder="Optionnel"
							placeholderTextColor="#666"
							maxLength={500}
						/>
					</Card>
				) : null}

				{(canAccept || canRefuse || canCancel) && (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Actions sur la proposition
						</Text>
						<Text className="mt-2 text-muted-foreground">
							Confirmez, refusez ou annulez cette proposition depuis cette zone.
						</Text>
					</Card>
				)}

				<View className="gap-3 pb-10">
					{canAccept ? (
						<Button
							label="Accepter"
							loading={acceptMutation.isPending}
							onPress={() => acceptMutation.mutate({ id })}
						/>
					) : null}
					{canRefuse ? (
						<Button
							label="Refuser"
							variant="secondary"
							loading={refuseMutation.isPending}
							onPress={() =>
								refuseMutation.mutate({
									id,
									reason: refusalReason.trim() || undefined,
								})
							}
						/>
					) : null}
					{canCancel ? (
						<Button
							label="Annuler ma proposition"
							variant="secondary"
							loading={cancelMutation.isPending}
							onPress={() => cancelMutation.mutate({ id })}
						/>
					) : null}
				</View>
			</KeyboardFormScreen>
		</Container>
	);
}
