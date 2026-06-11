import type { AppRouter } from "@rythmons/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { RolePill } from "@/components/ui/role-pill";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

type SlotItem = inferRouterOutputs<AppRouter>["availability"]["list"][number];

// Les jours du calendrier sont des dates « murales » épinglées en UTC
// (voir la convention dans @rythmons/validation) : toute la construction,
// la comparaison et le formatage passent par les accesseurs UTC.
function getMonthRange(year: number, month: number) {
	return {
		startDate: new Date(Date.UTC(year, month, 1)),
		endDate: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
	};
}

function getDaysInMonth(year: number, month: number) {
	const first = new Date(Date.UTC(year, month, 1));
	const last = new Date(Date.UTC(year, month + 1, 0));
	const days: Date[] = [];
	for (
		let day = new Date(first);
		day <= last;
		day.setUTCDate(day.getUTCDate() + 1)
	) {
		days.push(new Date(day));
	}
	return days;
}

function slotCoversDay(slot: SlotItem, day: Date) {
	const current = new Date(day);
	current.setUTCHours(0, 0, 0, 0);
	const start = new Date(slot.startDate);
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date(slot.endDate);
	end.setUTCHours(23, 59, 59, 999);
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
		left.getUTCFullYear() === right.getUTCFullYear() &&
		left.getUTCMonth() === right.getUTCMonth() &&
		left.getUTCDate() === right.getUTCDate()
	);
}

function buildCalendarCells(days: Date[]) {
	if (days.length === 0) return [];
	const leadingEmptyCells = (days[0].getUTCDay() + 6) % 7;
	return [...Array.from({ length: leadingEmptyCells }, () => null), ...days];
}

const weekDayHeaders = [
	{ key: "monday", label: "L" },
	{ key: "tuesday", label: "M" },
	{ key: "wednesday", label: "M" },
	{ key: "thursday", label: "J" },
	{ key: "friday", label: "V" },
	{ key: "saturday", label: "S" },
	{ key: "sunday", label: "D" },
] as const;

function showError(error: unknown, fallback: string) {
	const message = error instanceof Error ? error.message : fallback;
	Alert.alert("Erreur", message);
}

export default function CalendarScreen() {
	const params = useLocalSearchParams<{
		ownerType?: "ARTIST" | "VENUE";
		ownerId?: string;
		day?: string;
	}>();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const sessionRole = (
		session?.user as
			| {
					role?: "ARTIST" | "ORGANIZER" | "BOTH" | null;
			  }
			| undefined
	)?.role;
	const today = new Date();
	const [monthCursor, setMonthCursor] = useState(
		new Date(today.getFullYear(), today.getMonth(), 1),
	);
	const [ownerType, setOwnerType] = useState<"ARTIST" | "VENUE">("ARTIST");
	const [ownerTypeTouched, setOwnerTypeTouched] = useState(false);
	const [ownerId, setOwnerId] = useState("");
	const [selectedDay, setSelectedDay] = useState(
		new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())),
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
			await queryClient.invalidateQueries(trpc.availability.pathFilter());
		},
		onError: (error) =>
			showError(error, "Impossible de mettre à jour ce créneau."),
	});
	const deleteMutation = useMutation({
		...trpc.availability.delete.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries(trpc.availability.pathFilter());
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
		const targetOwnerType = params.ownerType;
		const targetOwnerId = Array.isArray(params.ownerId)
			? params.ownerId[0]
			: params.ownerId;
		const targetDayRaw = Array.isArray(params.day) ? params.day[0] : params.day;

		if (!targetOwnerType && !targetOwnerId && !targetDayRaw) {
			return;
		}

		setOwnerTypeTouched(true);

		if (
			targetOwnerType &&
			(targetOwnerType === "ARTIST" || targetOwnerType === "VENUE")
		) {
			setOwnerType(targetOwnerType);
		}

		if (targetOwnerId) {
			setOwnerId(targetOwnerId);
		}

		if (targetDayRaw) {
			const parsed = new Date(targetDayRaw);
			if (!Number.isNaN(parsed.getTime())) {
				setMonthCursor(
					new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1),
				);
				setSelectedDay(
					new Date(
						Date.UTC(
							parsed.getUTCFullYear(),
							parsed.getUTCMonth(),
							parsed.getUTCDate(),
						),
					),
				);
			}
		}
	}, [params.day, params.ownerId, params.ownerType]);

	useEffect(() => {
		if (ownerTypeTouched) return;

		const hasArtistProfiles = artistOptions.length > 0;
		const hasVenueProfiles = venueOptions.length > 0;

		if (ownerType === "ARTIST" && !hasArtistProfiles && hasVenueProfiles) {
			setOwnerType("VENUE");
			setOwnerId("");
			return;
		}

		if (ownerType === "VENUE" && !hasVenueProfiles && hasArtistProfiles) {
			setOwnerType("ARTIST");
			setOwnerId("");
		}
	}, [artistOptions.length, venueOptions.length, ownerType, ownerTypeTouched]);

	useEffect(() => {
		if (!ownerId) return;
		const ownerStillExists = ownerOptions.some(
			(option) => option.id === ownerId,
		);
		if (!ownerStillExists) {
			setOwnerId("");
		}
	}, [ownerId, ownerOptions]);

	useEffect(() => {
		const selectedMonth = selectedDay.getUTCMonth();
		const selectedYear = selectedDay.getUTCFullYear();
		if (
			selectedMonth !== monthCursor.getMonth() ||
			selectedYear !== monthCursor.getFullYear()
		) {
			setSelectedDay(
				new Date(
					Date.UTC(monthCursor.getFullYear(), monthCursor.getMonth(), 1),
				),
			);
		}
	}, [monthCursor, selectedDay]);

	const createSlotForSelectedDay = () => {
		const startDate = new Date(selectedDay);
		startDate.setUTCHours(0, 0, 0, 0);
		const endDate = new Date(selectedDay);
		endDate.setUTCHours(23, 59, 59, 999);
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
			<View className="flex-1">
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
					<View className="gap-1">
						<Title className="text-3xl text-foreground">Calendrier</Title>
					</View>
					<RolePill role={sessionRole} />

					<View className="flex-row gap-2">
						<Button
							label="Artiste"
							variant={ownerType === "ARTIST" ? "primary" : "secondary"}
							onPress={() => {
								setOwnerTypeTouched(true);
								setOwnerType("ARTIST");
								setOwnerId("");
							}}
						/>
						<Button
							label="Lieu"
							variant={ownerType === "VENUE" ? "primary" : "secondary"}
							onPress={() => {
								setOwnerTypeTouched(true);
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
					<View className="flex-row justify-end">
						<TouchableOpacity
							activeOpacity={0.85}
							className="rounded-full border border-border bg-card px-4 py-2"
							onPress={() => {
								const now = new Date();
								setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
								setSelectedDay(
									new Date(
										Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
									),
								);
							}}
						>
							<Text className="font-sans-medium text-foreground text-sm">
								Aujourd&apos;hui
							</Text>
						</TouchableOpacity>
					</View>

					{!effectiveOwnerId ? (
						<Card className="border-dashed">
							<Text className="text-muted-foreground">
								Créez un profil {ownerType === "ARTIST" ? "artiste" : "lieu"}{" "}
								pour gérer ce calendrier.
							</Text>
							<Button
								label={
									ownerType === "ARTIST" ? "Creer un artiste" : "Creer un lieu"
								}
								className="mt-3 self-start"
								onPress={() =>
									router.push(
										ownerType === "ARTIST"
											? "/(drawer)/artist/new"
											: "/(drawer)/venue/new",
									)
								}
							/>
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
									{weekDayHeaders.map((header) => (
										<View key={header.key} className="w-[13.5%] py-2">
											<Text className="text-center font-sans-medium text-muted-foreground text-xs">
												{header.label}
											</Text>
										</View>
									))}
								</View>
								<View className="mt-2 flex-row flex-wrap gap-y-2">
									{(() => {
										let emptyCellCount = 0;
										return calendarCells.map((day) => {
											if (!day) {
												emptyCellCount += 1;
												return (
													<View
														key={`empty-${monthCursor.getFullYear()}-${monthCursor.getMonth()}-${emptyCellCount}`}
														className="w-[13.5%] py-6"
													/>
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
														label={String(day.getUTCDate())}
														variant={isSelected ? "primary" : "secondary"}
														className={`min-h-14 rounded-xl border px-0 ${isSelected ? "" : cellClasses}`}
														textClassName={`text-sm ${!isSelected && isBooked ? "text-blue-200" : !isSelected && isUnavailable ? "text-red-200" : !isSelected && isOpen ? "text-green-200" : ""}`}
														onPress={() => setSelectedDay(day)}
													/>
												</View>
											);
										});
									})()}
								</View>
							</Card>

							<Card>
								<Text className="font-sans-bold text-foreground">
									{selectedDay.toLocaleDateString("fr-FR", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
										timeZone: "UTC",
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
						</View>
					)}
				</ScrollView>
			</View>
		</Container>
	);
}
