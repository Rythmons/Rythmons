import type { AppRouter } from "@rythmons/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	RefreshControl,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

type SlotItem = inferRouterOutputs<AppRouter>["availability"]["list"][number];

function getMonthRange(year: number, month: number) {
	return {
		startDate: new Date(year, month, 1),
		endDate: new Date(year, month + 1, 0, 23, 59, 59, 999),
	};
}

function getDaysInMonth(year: number, month: number) {
	const first = new Date(year, month, 1);
	const last = new Date(year, month + 1, 0);
	const days: Date[] = [];
	for (let day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
		days.push(new Date(day));
	}
	return days;
}

function slotCoversDay(slot: SlotItem, day: Date) {
	const current = new Date(day);
	current.setHours(0, 0, 0, 0);
	const start = new Date(slot.startDate);
	start.setHours(0, 0, 0, 0);
	const end = new Date(slot.endDate);
	end.setHours(23, 59, 59, 999);
	return current >= start && current <= end;
}

function getSlotForDay(slots: SlotItem[], day: Date) {
	const covering = slots.filter((slot) => slotCoversDay(slot, day));
	return (
		covering.find((slot) => slot.type === "BOOKED") ??
		covering.find((slot) => slot.type === "UNAVAILABLE") ??
		covering.find((slot) => slot.type === "OPEN") ??
		null
	);
}

function showError(error: unknown, fallback: string) {
	const message = error instanceof Error ? error.message : fallback;
	Alert.alert("Erreur", message);
}

export default function CalendarScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const today = new Date();
	const [monthCursor, setMonthCursor] = useState(
		new Date(today.getFullYear(), today.getMonth(), 1),
	);
	const [ownerType, setOwnerType] = useState<"ARTIST" | "VENUE">("ARTIST");
	const [ownerId, setOwnerId] = useState("");

	const myArtistsQuery = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user),
	});
	const myVenuesQuery = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user),
	});

	const artistOptions = myArtistsQuery.data ?? [];
	const venueOptions = myVenuesQuery.data ?? [];
	const ownerOptions = ownerType === "ARTIST" ? artistOptions : venueOptions;
	const effectiveOwnerId = ownerId || ownerOptions[0]?.id || "";
	const range = getMonthRange(
		monthCursor.getFullYear(),
		monthCursor.getMonth(),
	);
	const slotsQuery = useQuery({
		...trpc.availability.list.queryOptions({
			ownerType,
			ownerId: effectiveOwnerId,
			startDate: range.startDate,
			endDate: range.endDate,
		}),
		enabled: Boolean(session?.user) && Boolean(effectiveOwnerId),
	});

	const upsertMutation = useMutation({
		...trpc.availability.upsert.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
		},
		onError: (error) =>
			showError(error, "Impossible de mettre à jour ce créneau."),
	});
	const deleteMutation = useMutation({
		...trpc.availability.delete.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
		},
		onError: (error) => showError(error, "Impossible de supprimer ce créneau."),
	});

	const days = useMemo(
		() => getDaysInMonth(monthCursor.getFullYear(), monthCursor.getMonth()),
		[monthCursor],
	);

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
						Connectez-vous pour gérer votre calendrier.
					</Text>
				</View>
			</Container>
		);
	}

	return (
		<Container>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
				refreshControl={
					<RefreshControl
						refreshing={
							slotsQuery.isFetching ||
							myArtistsQuery.isFetching ||
							myVenuesQuery.isFetching
						}
						onRefresh={() => {
							void myArtistsQuery.refetch();
							void myVenuesQuery.refetch();
							if (effectiveOwnerId) {
								void slotsQuery.refetch();
							}
						}}
					/>
				}
			>
				<View className="gap-2">
					<Title className="text-3xl text-foreground">Calendrier</Title>
					<Text className="text-muted-foreground">
						Marquez vos indisponibilités artiste, vos ouvertures de lieu et
						consultez les bookings confirmés.
					</Text>
				</View>

				<View className="flex-row flex-wrap gap-3">
					<Button
						label="Mes bookings"
						variant="secondary"
						onPress={() => router.push("/(drawer)/bookings" as never)}
					/>
					<Button
						label="Recherche"
						variant="secondary"
						onPress={() => router.push("/(drawer)/search" as never)}
					/>
				</View>

				<View className="flex-row gap-2">
					<Button
						label="Artiste"
						variant={ownerType === "ARTIST" ? "primary" : "secondary"}
						onPress={() => {
							setOwnerType("ARTIST");
							setOwnerId("");
						}}
					/>
					<Button
						label="Lieu"
						variant={ownerType === "VENUE" ? "primary" : "secondary"}
						onPress={() => {
							setOwnerType("VENUE");
							setOwnerId("");
						}}
					/>
				</View>

				{ownerOptions.length > 1 ? (
					<Card>
						<Text className="font-sans-bold text-foreground">
							Profil à afficher
						</Text>
						<View className="mt-3 gap-2">
							{ownerType === "ARTIST"
								? artistOptions.map((artist) => (
										<Button
											key={artist.id}
											label={artist.stageName}
											variant={
												(ownerId || artistOptions[0]?.id) === artist.id
													? "primary"
													: "secondary"
											}
											onPress={() => setOwnerId(artist.id)}
										/>
									))
								: venueOptions.map((venue) => (
										<Button
											key={venue.id}
											label={venue.name}
											variant={
												(ownerId || venueOptions[0]?.id) === venue.id
													? "primary"
													: "secondary"
											}
											onPress={() => setOwnerId(venue.id)}
										/>
									))}
						</View>
					</Card>
				) : null}

				<View className="flex-row items-center justify-between">
					<Button
						label="Mois précédent"
						variant="secondary"
						onPress={() =>
							setMonthCursor(
								new Date(
									monthCursor.getFullYear(),
									monthCursor.getMonth() - 1,
									1,
								),
							)
						}
					/>
					<Text className="font-sans-bold text-foreground">
						{monthCursor.toLocaleDateString("fr-FR", {
							month: "long",
							year: "numeric",
						})}
					</Text>
					<Button
						label="Mois suivant"
						variant="secondary"
						onPress={() =>
							setMonthCursor(
								new Date(
									monthCursor.getFullYear(),
									monthCursor.getMonth() + 1,
									1,
								),
							)
						}
					/>
				</View>

				<Text className="text-muted-foreground text-sm">
					{ownerType === "ARTIST"
						? "Touchez un jour pour le marquer indisponible ou retirer ce créneau."
						: "Touchez un jour pour l’ouvrir à la programmation ou retirer ce créneau."}
				</Text>

				{!effectiveOwnerId ? (
					<Card className="border-dashed">
						<Text className="text-muted-foreground">
							Créez un profil {ownerType === "ARTIST" ? "artiste" : "lieu"} pour
							gérer ce calendrier.
						</Text>
					</Card>
				) : slotsQuery.isLoading ? (
					<Card>
						<Text className="text-muted-foreground">
							Chargement du calendrier...
						</Text>
					</Card>
				) : (
					<View className="gap-3">
						{days.map((day) => {
							const slot = getSlotForDay(
								(slotsQuery.data ?? []) as SlotItem[],
								day,
							);
							const isBooked = slot?.type === "BOOKED";
							const isUnavailable = slot?.type === "UNAVAILABLE";
							const isOpen = slot?.type === "OPEN";
							const bgClass = isBooked
								? "bg-blue-500/10 border-blue-500/30"
								: isUnavailable
									? "bg-red-500/10 border-red-500/30"
									: isOpen
										? "bg-green-500/10 border-green-500/30"
										: "bg-card";

							return (
								<TouchableOpacity
									key={day.toISOString()}
									activeOpacity={0.9}
									onPress={() => {
										const startDate = new Date(day);
										startDate.setHours(0, 0, 0, 0);
										const endDate = new Date(day);
										endDate.setHours(23, 59, 59, 999);

										if (slot?.type === "BOOKED") {
											if (slot.booking?.id) {
												router.push({
													pathname: "/(drawer)/bookings/[id]",
													params: { id: slot.booking.id },
												} as never);
											}
											return;
										}

										if (slot && !slot.bookingId) {
											deleteMutation.mutate({ id: slot.id });
											return;
										}

										upsertMutation.mutate({
											ownerType,
											ownerId: effectiveOwnerId,
											startDate,
											endDate,
											type: ownerType === "ARTIST" ? "UNAVAILABLE" : "OPEN",
										});
									}}
								>
									<Card className={bgClass}>
										<View className="flex-row items-start justify-between gap-3">
											<View className="flex-1">
												<Text className="font-sans-bold text-foreground">
													{day.toLocaleDateString("fr-FR", {
														weekday: "long",
														day: "numeric",
														month: "long",
													})}
												</Text>
												<Text className="mt-1 text-muted-foreground">
													{isBooked
														? "Booking confirmé"
														: isUnavailable
															? "Indisponible"
															: isOpen
																? "Ouvert"
																: "Aucun créneau"}
												</Text>
												{slot?.booking ? (
													<Text className="mt-2 text-muted-foreground text-sm">
														{slot.booking.artist?.stageName ??
															slot.booking.venue?.name ??
															"Booking"}
													</Text>
												) : null}
											</View>
											<Text className="text-muted-foreground text-sm">
												{day.getDate()}
											</Text>
										</View>
									</Card>
								</TouchableOpacity>
							);
						})}
					</View>
				)}
			</ScrollView>
		</Container>
	);
}
