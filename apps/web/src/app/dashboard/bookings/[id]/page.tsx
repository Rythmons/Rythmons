"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

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
			queryClient.invalidateQueries();
			toast.success("Proposition acceptée !");
			router.push("/dashboard/bookings");
		},
		onError: (e) => toast.error(e.message),
	});

	const refuseMutation = useMutation({
		...trpc.booking.refuse.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success("Proposition refusée.");
			router.push("/dashboard/bookings");
		},
		onError: (e) => toast.error(e.message),
	});

	const cancelMutation = useMutation({
		...trpc.booking.cancel.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success("Proposition annulée.");
			router.push("/dashboard/bookings");
		},
		onError: (e) => toast.error(e.message),
	});

	if (sessionPending || !session?.user) {
		return (
			<div className="container mx-auto max-w-2xl py-12 text-center">
				<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (isLoading || !booking) {
		return (
			<div className="container mx-auto max-w-2xl py-12 text-center">
				{error ? (
					<>
						<p className="text-destructive">{error.message}</p>
						<Button asChild className="mt-4">
							<Link href="/dashboard/bookings">Retour aux propositions</Link>
						</Button>
					</>
				) : (
					<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
				)}
			</div>
		);
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

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<div className="mb-6 flex items-center justify-between">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/dashboard/bookings">← Retour aux propositions</Link>
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
							})}
						</p>
						{booking.proposedFee != null && (
							<p className="text-muted-foreground text-sm">
								Cachet proposé : {booking.proposedFee} €
							</p>
						)}
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<p className="text-muted-foreground text-sm">Artiste</p>
						<Link
							href={`/artist/${booking.artist.id}`}
							className="font-medium text-primary hover:underline"
						>
							{booking.artist.stageName}
						</Link>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Lieu</p>
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
						<p className="text-muted-foreground text-sm">Message</p>
						<p className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">
							{booking.initialMessage}
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

				{(canAccept || canRefuse || canCancel) && (
					<div className="flex flex-wrap gap-3 border-t pt-4">
						{canAccept && (
							<Button
								onClick={() => acceptMutation.mutate({ id })}
								disabled={acceptMutation.isPending}
							>
								Accepter
							</Button>
						)}
						{canRefuse && (
							<Button
								variant="destructive"
								onClick={() => refuseMutation.mutate({ id })}
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
