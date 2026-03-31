import type { AppRouter } from "@rythmons/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	RefreshControl,
	ScrollView,
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

function isSameDay(left: Date, right: Date) {
	return (
		left.getFullYear() === right.getFullYear() &&
		left.getMonth() === right.getMonth() &&
		left.getDate() === right.getDate()
	);
}

function buildCalendarCells(days: Date[]) {
	if (days.length === 0) return [];
	const leadingEmptyCells = (days[0].getDay() + 6) % 7;
	return [...Array.from({ length: leadingEmptyCells }, () => null), ...days];
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
	const [selectedDay, setSelectedDay] = useState(
		new Date(today.getFullYear(), today.getMonth(), today.getDate()),
	);

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
	const calendarCells = useMemo(() => buildCalendarCells(days), [days]);
	const selectedSlot = useMemo(
		() => getSlotForDay((slotsQuery.data ?? []) as SlotItem[], selectedDay),
		[selectedDay, slotsQuery.data],
	);

	useEffect(() => {
		const selectedMonth = selectedDay.getMonth();
		const selectedYear = selectedDay.getFullYear();
		if (
			selectedMonth !== monthCursor.getMonth() ||
			selectedYear !== monthCursor.getFullYear()
		) {
			setSelectedDay(
				new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1),
			);
		}
	}, [monthCursor, selectedDay]);

	const createSlotForSelectedDay = () => {
		const startDate = new Date(selectedDay);
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(selectedDay);
		endDate.setHours(23, 59, 59, 999);
		upsertMutation.mutate({
			ownerType,
			ownerId: effectiveOwnerId,
			startDate,
			endDate,
			type: ownerType === "ARTIST" ? "UNAVAILABLE" : "OPEN",
		});
	};

	const confirmDeleteSelectedSlot = () => {
		if (!selectedSlot || selectedSlot.bookingId) return;
		Alert.alert(
			"Supprimer ce créneau ?",
			ownerType === "ARTIST"
				? "Cette journée redeviendra disponible dans votre planning."
				: "Cette journée ne sera plus ouverte à la programmation.",
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
					style: "destructive",
					onPress: () => deleteMutation.mutate({ id: selectedSlot.id }),
				},
			],
		);
	};

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
					Sélectionnez une date dans la grille, puis utilisez les actions
					dédiées pour voir, ajouter ou supprimer un créneau.
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
						<Card>
							<View className="flex-row justify-between">
								{["L", "M", "M", "J", "V", "S", "D"].map((label, index) => (
									<View key={`${label}-${index}`} className="w-[13.5%] py-2">
										<Text className="text-center font-sans-medium text-muted-foreground text-xs">
											{label}
										</Text>
									</View>
								))}
							</View>
							<View className="mt-2 flex-row flex-wrap gap-y-2">
								{calendarCells.map((day, index) => {
									if (!day) {
										return (
											<View key={`empty-${index}`} className="w-[13.5%] py-6" />
										);
									}

									const slot = getSlotForDay(
										(slotsQuery.data ?? []) as SlotItem[],
										day,
									);
									const isBooked = slot?.type === "BOOKED";
									const isUnavailable = slot?.type === "UNAVAILABLE";
									const isOpen = slot?.type === "OPEN";
									const isSelected = isSameDay(day, selectedDay);
									const cellClasses = isBooked
										? "border-blue-500/40 bg-blue-500/15"
										: isUnavailable
											? "border-red-500/40 bg-red-500/15"
											: isOpen
												? "border-green-500/40 bg-green-500/15"
												: "border-border bg-background";

									return (
										<View key={day.toISOString()} className="w-[13.5%]">
											<Button
												label={String(day.getDate())}
												variant={isSelected ? "primary" : "secondary"}
												className={`min-h-14 rounded-xl border px-0 ${isSelected ? "" : cellClasses}`}
												textClassName={`text-sm ${!isSelected && isBooked ? "text-blue-200" : !isSelected && isUnavailable ? "text-red-200" : !isSelected && isOpen ? "text-green-200" : ""}`}
												onPress={() => setSelectedDay(day)}
											/>
										</View>
									);
								})}
							</View>
						</Card>

						<Card>
							<Text className="font-sans-bold text-foreground">
								{selectedDay.toLocaleDateString("fr-FR", {
									weekday: "long",
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</Text>
							<Text className="mt-2 text-muted-foreground">
								{selectedSlot?.type === "BOOKED"
									? "Booking confirmé"
									: selectedSlot?.type === "UNAVAILABLE"
										? "Indisponible"
										: selectedSlot?.type === "OPEN"
											? "Ouvert à la programmation"
											: "Aucun créneau enregistré"}
							</Text>
							{selectedSlot?.booking ? (
								<Text className="mt-2 text-muted-foreground text-sm">
									{selectedSlot.booking.artist?.stageName ??
										selectedSlot.booking.venue?.name ??
										"Booking"}
								</Text>
							) : (
								<Text className="mt-2 text-muted-foreground text-sm">
									{ownerType === "ARTIST"
										? "Utilisez ce planning pour bloquer vos indisponibilités."
										: "Utilisez ce planning pour marquer les dates ouvertes à la programmation."}
								</Text>
							)}
						</Card>

						<View className="gap-3">
							{selectedSlot?.type === "BOOKED" && selectedSlot.booking?.id ? (
								<Button
									label="Voir le booking confirme"
									onPress={() =>
										router.push({
											pathname: "/(drawer)/bookings/[id]",
											params: { id: selectedSlot.booking?.id ?? "" },
										} as never)
									}
								/>
							) : null}

							{!selectedSlot ? (
								<Button
									label={
										ownerType === "ARTIST"
											? "Marquer comme indisponible"
											: "Ouvrir cette date"
									}
									loading={upsertMutation.isPending}
									onPress={createSlotForSelectedDay}
								/>
							) : null}

							{selectedSlot &&
							selectedSlot.type !== "BOOKED" &&
							!selectedSlot.bookingId ? (
								<Button
									label="Supprimer ce creneau"
									variant="secondary"
									loading={deleteMutation.isPending}
									onPress={confirmDeleteSelectedSlot}
								/>
							) : null}
						</View>
					</View>
				)}
			</ScrollView>
		</Container>
	);
}
