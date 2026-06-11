"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

function BookingDetailSkeleton() {
	return (
		<div className="container mx-auto max-w-2xl py-12">
			<div className="rounded-xl border bg-card p-6 shadow-sm">
				<div className="space-y-4">
					<Skeleton className="h-7 w-64" />
					<Skeleton className="h-4 w-full max-w-md" />
					<Skeleton className="h-4 w-48" />
					<div className="flex gap-2 pt-4">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
			</div>
		</div>
	);
}

const STATUS_LABELS: Record<string, string> = {
	PENDING: "En attente",
	ACCEPTED: "Acceptée",
	REFUSED: "Refusée",
	CANCELLED: "Annulée",
};

export default function BookingDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const id = params.id as string;
	const [refusalReasonInput, setRefusalReasonInput] = useState("");
	const [acceptBlockedByVenueDate, setAcceptBlockedByVenueDate] =
		useState(false);
	const bookingsRoute = "/dashboard/bookings" as Route;

	const { data: session, isPending: sessionPending } = authClient.useSession();
	const {
		data: booking,
		isLoading,
		error,
	} = useQuery({
		...trpc.booking.getById.queryOptions({ id }),
		enabled: !!session?.user && !!id,
	});

	const acceptMutation = useMutation({
		...trpc.booking.accept.mutationOptions(),
		onSuccess: () => {
			// L'acceptation crée aussi des créneaux BOOKED dans le calendrier.
			queryClient.invalidateQueries(trpc.booking.pathFilter());
			queryClient.invalidateQueries(trpc.availability.pathFilter());
			setAcceptBlockedByVenueDate(false);
			toast.success("Proposition acceptée !");
			router.push(bookingsRoute);
		},
		onError: (e) => {
			if (e.message.includes("Le lieu n'est pas ouvert")) {
				setAcceptBlockedByVenueDate(true);
			} else {
				toast.error(e.message);
			}
		},
	});

	const refuseMutation = useMutation({
		...trpc.booking.refuse.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.booking.pathFilter());
			toast.success("Proposition refusée.");
			router.push(bookingsRoute);
		},
		onError: (e) => toast.error(e.message),
	});

	const cancelMutation = useMutation({
		...trpc.booking.cancel.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.booking.pathFilter());
			toast.success("Proposition annulée.");
			router.push(bookingsRoute);
		},
		onError: (e) => toast.error(e.message),
	});

	if (sessionPending || !session?.user) {
		return <BookingDetailSkeleton />;
	}

	if (isLoading || !booking) {
		if (error) {
			return (
				<div className="container mx-auto max-w-2xl py-12 text-center">
					<p className="text-destructive">{error.message}</p>
					<Button asChild className="mt-4">
						<Link href={bookingsRoute}>Retour aux propositions</Link>
					</Button>
				</div>
			);
		}
		return <BookingDetailSkeleton />;
	}

	const myUserId = session.user.id;
	const isCreator = booking.createdByUserId === myUserId;
	const isArtist = booking.artist.userId === myUserId;
	const isOrganizer = booking.venue.ownerId === myUserId;
	const canAccept =
		!isCreator && (isArtist || isOrganizer) && booking.status === "PENDING";
	const canRefuse =
		!isCreator && (isArtist || isOrganizer) && booking.status === "PENDING";
	const canCancel = isCreator && booking.status === "PENDING";
	const initiatorLabel = isCreator
		? "Vous"
		: (booking.createdBy?.name ?? "Autre");
	const refusalReason =
		(booking as typeof booking & { refusalReason?: string | null })
			.refusalReason ?? null;

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<div className="mb-6 flex items-center justify-between">
				<Button variant="ghost" size="sm" asChild>
					<Link href={bookingsRoute}>← Retour aux propositions</Link>
				</Button>
				<span
					className={`rounded-full px-3 py-1 font-medium text-sm ${
						booking.status === "PENDING"
							? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
							: booking.status === "ACCEPTED"
								? "bg-green-500/20 text-green-600 dark:text-green-400"
								: booking.status === "REFUSED"
									? "bg-red-500/20 text-red-600 dark:text-red-400"
									: "bg-muted text-muted-foreground"
					}`}
				>
					{STATUS_LABELS[booking.status] ?? booking.status}
				</span>
			</div>

			<div className="space-y-6 rounded-xl border bg-card p-6">
				<div className="flex items-center gap-3">
					<Calendar className="h-8 w-8 text-muted-foreground" />
					<div>
						<p className="font-semibold">
							{new Date(booking.proposedDate).toLocaleString("fr-FR", {
								dateStyle: "long",
								timeStyle: "short",
								timeZone: "UTC",
							})}
						</p>
						{booking.proposedFee != null && (
							<p className="text-muted-foreground text-sm">
								Cachet proposé : {booking.proposedFee} €
							</p>
						)}
					</div>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					<div className="rounded-lg bg-muted/30 p-4">
						<p className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							EXPÉDITEUR
						</p>
						<p className="font-medium text-lg">{initiatorLabel}</p>
					</div>
					<div className="rounded-lg bg-muted/30 p-4">
						<p className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							DESTINATAIRE
						</p>
						<p className="font-medium text-lg">
							{isCreator
								? isArtist
									? booking.venue.name
									: booking.artist.stageName
								: "Vous"}
						</p>
					</div>
					<div>
						<p className="font-medium text-muted-foreground text-sm">
							Artiste concerné
						</p>
						<Link
							href={`/artist/${booking.artist.id}`}
							className="font-medium text-primary hover:underline"
						>
							{booking.artist.stageName}
						</Link>
					</div>
					<div>
						<p className="font-medium text-muted-foreground text-sm">
							Lieu concerné
						</p>
						<Link
							href={`/venue/${booking.venue.id}`}
							className="font-medium text-primary hover:underline"
						>
							{booking.venue.name}
						</Link>
					</div>
				</div>

				{booking.initialMessage && (
					<div>
						<p className="text-muted-foreground text-sm">Message initial</p>
						<p className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">
							{booking.initialMessage}
						</p>
					</div>
				)}

				{refusalReason && (
					<div>
						<p className="text-muted-foreground text-sm">Motif du refus</p>
						<p className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">
							{refusalReason}
						</p>
					</div>
				)}

				{booking.status === "ACCEPTED" && (
					<div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
						<p className="font-medium text-green-700 dark:text-green-400">
							Booking confirmé
						</p>
						<p className="mt-2 text-muted-foreground text-sm">
							Contact artiste : {booking.artist.user?.email ?? "—"}
						</p>
						<p className="text-muted-foreground text-sm">
							Contact lieu : {booking.venue.owner?.email ?? "—"}
						</p>
						{booking.artist.techRequirements && (
							<p className="mt-2 text-sm">
								<span className="text-muted-foreground">Fiche tech : </span>
								{booking.artist.techRequirements}
							</p>
						)}
					</div>
				)}

				{canRefuse && (
					<div className="space-y-2 rounded-lg border border-dashed p-4">
						<p className="font-medium text-sm">
							Refuser avec un motif optionnel
						</p>
						<Textarea
							value={refusalReasonInput}
							onChange={(e) => setRefusalReasonInput(e.target.value)}
							placeholder="Expliquez brièvement pourquoi vous refusez cette proposition."
							maxLength={500}
							rows={3}
						/>
					</div>
				)}

				{(canAccept || canRefuse || canCancel) && (
					<div className="flex flex-wrap gap-3 border-t pt-4">
						{canAccept && acceptBlockedByVenueDate ? (
							<div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
								<p className="font-medium">Action requise</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Pour accepter ce booking, ouvrez d&apos;abord la date dans le
									calendrier du lieu.
								</p>
								<div className="mt-3 flex flex-wrap gap-3">
									<Button
										variant="outline"
										onClick={() =>
											router.push(
												`/dashboard/calendar?ownerType=VENUE&ownerId=${booking.venue.id}&day=${encodeURIComponent(
													booking.proposedDate,
												)}`,
											)
										}
									>
										Ouvrir le calendrier du lieu
									</Button>
									<Button
										onClick={() => {
											setAcceptBlockedByVenueDate(false);
											acceptMutation.mutate({ id });
										}}
										disabled={acceptMutation.isPending}
									>
										Réessayer l&apos;acceptation
									</Button>
								</div>
							</div>
						) : null}
						{canAccept && (
							<Button
								onClick={() => acceptMutation.mutate({ id })}
								disabled={acceptMutation.isPending || acceptBlockedByVenueDate}
							>
								Accepter
							</Button>
						)}
						{canRefuse && (
							<Button
								variant="destructive"
								onClick={() =>
									refuseMutation.mutate({
										id,
										reason: refusalReasonInput.trim() || undefined,
									})
								}
								disabled={refuseMutation.isPending}
							>
								Refuser
							</Button>
						)}
						{canCancel && (
							<Button
								variant="outline"
								onClick={() => cancelMutation.mutate({ id })}
								disabled={cancelMutation.isPending}
							>
								Annuler ma proposition
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
