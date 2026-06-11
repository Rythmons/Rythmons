import type { AppRouter } from "@rythmons/api";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { router } from "expo-router";
import { useState } from "react";
import {
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
import { trpc } from "@/utils/trpc";

type BookingItem = inferRouterOutputs<AppRouter>["booking"]["listMine"][number];
type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REFUSED" | "CANCELLED";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
	{ value: "ALL", label: "Toutes" },
	{ value: "PENDING", label: "En attente" },
	{ value: "ACCEPTED", label: "Acceptées" },
	{ value: "REFUSED", label: "Refusées" },
	{ value: "CANCELLED", label: "Annulées" },
];

const STATUS_LABELS: Record<Exclude<StatusFilter, "ALL">, string> = {
	PENDING: "En attente",
	ACCEPTED: "Acceptée",
	REFUSED: "Refusée",
	CANCELLED: "Annulée",
};

function statusClasses(status: BookingItem["status"]) {
	switch (status) {
		case "PENDING":
			return "bg-amber-500/15 text-amber-300";
		case "ACCEPTED":
			return "bg-green-500/15 text-green-300";
		case "REFUSED":
			return "bg-red-500/15 text-red-300";
		default:
			return "bg-muted text-muted-foreground";
	}
}

export default function BookingsScreen() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const sessionRole = (
		session?.user as
			| {
					role?: "ARTIST" | "ORGANIZER" | "BOTH" | null;
			  }
			| undefined
	)?.role;
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const bookingsQuery = useQuery({
		...trpc.booking.listMine.queryOptions(
			statusFilter === "ALL" ? undefined : { status: statusFilter },
		),
		enabled: Boolean(session?.user),
	});

	if (sessionPending) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Text className="text-muted-foreground">Chargement...</Text>
				</View>
			</Container>
		);
	}

	if (!session?.user) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Title className="mb-2 text-center text-2xl">Bookings</Title>
					<Text className="text-center text-muted-foreground">
						Connectez-vous pour consulter vos propositions.
					</Text>
				</View>
			</Container>
		);
	}

	const bookings = (bookingsQuery.data ?? []) as BookingItem[];

	return (
		<Container>
			<View className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
					refreshControl={
						<RefreshControl
							refreshing={bookingsQuery.isFetching}
							onRefresh={() => void bookingsQuery.refetch()}
						/>
					}
				>
					<View className="gap-2">
						<Title className="text-3xl text-foreground">Bookings</Title>
						<Text className="text-muted-foreground">
							Suivez vos propositions envoyées et reçues, puis ouvrez le détail
							pour accepter, refuser ou annuler.
						</Text>
						<RolePill role={sessionRole} />
					</View>

					<View className="flex-row flex-wrap gap-2">
						{STATUS_FILTERS.map((filter) => (
							<Button
								key={filter.value}
								label={filter.label}
								variant={
									statusFilter === filter.value ? "primary" : "secondary"
								}
								className="min-h-10 px-3"
								textClassName="text-sm"
								onPress={() => setStatusFilter(filter.value)}
							/>
						))}
					</View>

					<View className="flex-row flex-wrap gap-3">
						<Button
							label="Chercher un lieu"
							onPress={() => router.push("/(drawer)/search" as never)}
						/>
						<Button
							label="Mon calendrier"
							variant="secondary"
							onPress={() => router.push("/(drawer)/calendar" as never)}
						/>
					</View>

					{bookingsQuery.isLoading ? (
						<Card>
							<Text className="text-muted-foreground">
								Chargement des bookings...
							</Text>
						</Card>
					) : bookings.length === 0 ? (
						<Card className="border-dashed">
							<Title className="text-foreground text-xl">
								Aucune proposition
							</Title>
							<Text className="mt-2 text-muted-foreground">
								Lancez une recherche puis utilisez le bouton "Proposer un
								booking" depuis une fiche artiste ou lieu.
							</Text>
						</Card>
					) : (
						<View className="gap-3">
							{bookings.map((booking) => {
								const isSent = booking.createdByUserId === session.user.id;
								const otherName = isSent
									? booking.venue.name
									: booking.artist.stageName;
								return (
									<TouchableOpacity
										key={booking.id}
										activeOpacity={0.9}
										onPress={() =>
											router.push({
												pathname: "/(drawer)/bookings/[id]",
												params: { id: booking.id },
											} as never)
										}
									>
										<Card>
											<View className="flex-row items-start justify-between gap-3">
												<View className="flex-1">
													<Text className="font-sans-medium text-foreground">
														{isSent ? "Vers" : "De"} {otherName}
													</Text>
													<Text className="mt-1 text-muted-foreground text-sm">
														{new Date(booking.proposedDate).toLocaleString(
															"fr-FR",
															{
																dateStyle: "medium",
																timeStyle: "short",
															},
														)}
													</Text>
													{booking.proposedFee != null ? (
														<Text className="mt-1 text-muted-foreground text-sm">
															Cachet proposé: {booking.proposedFee} €
														</Text>
													) : null}
												</View>
												<View
													className={`rounded-full px-3 py-1 ${statusClasses(booking.status)}`}
												>
													<Text className="font-sans-medium text-xs">
														{STATUS_LABELS[booking.status]}
													</Text>
												</View>
											</View>
										</Card>
									</TouchableOpacity>
								);
							})}
						</View>
					)}
				</ScrollView>
			</View>
		</Container>
	);
}
