"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

function ProposePageSkeleton() {
	return (
		<div className="container mx-auto max-w-lg py-12">
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}

function ProposeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const venueId = searchParams.get("venueId");
	const artistId = searchParams.get("artistId");

	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { data: myArtists } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: !!session?.user && !!venueId,
	});
	const { data: myVenues } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: !!session?.user && !!artistId,
	});

	const [selectedArtistId, setSelectedArtistId] = useState<string>("");
	const [selectedVenueId, setSelectedVenueId] = useState<string>("");
	const [proposedDate, setProposedDate] = useState("");
	const [proposedTime, setProposedTime] = useState("19:00");
	const [proposedFee, setProposedFee] = useState("");
	const [initialMessage, setInitialMessage] = useState("");

	const isArtistProposing = !!venueId;

	useEffect(() => {
		if (isArtistProposing && myArtists?.length && !selectedArtistId) {
			setSelectedArtistId(myArtists[0].id);
		}
	}, [isArtistProposing, myArtists, selectedArtistId]);

	useEffect(() => {
		if (!isArtistProposing && myVenues?.length && !selectedVenueId) {
			setSelectedVenueId(myVenues[0].id);
		}
	}, [isArtistProposing, myVenues, selectedVenueId]);

	const createMutation = useMutation({
		...trpc.booking.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success("Proposition envoyée !");
			router.push("/dashboard/bookings");
		},
		onError: (err) => {
			toast.error(err.message || "Erreur lors de l'envoi");
		},
	});

	if (sessionPending || !session?.user) {
		return <ProposePageSkeleton />;
	}

	if (!venueId && !artistId) {
		return (
			<div className="container mx-auto max-w-lg py-12">
				<p className="text-muted-foreground">
					Paramètre manquant. Utilisez le bouton &quot;Proposer un booking&quot;
					depuis une fiche lieu ou artiste.
				</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard">Retour au tableau de bord</Link>
				</Button>
			</div>
		);
	}

	const effectiveArtistId = isArtistProposing
		? myArtists?.length === 1
			? myArtists[0].id
			: selectedArtistId
		: (artistId ?? "");
	const effectiveVenueId = isArtistProposing
		? (venueId ?? "")
		: myVenues?.length === 1
			? myVenues[0].id
			: selectedVenueId;

	const canSubmit =
		effectiveArtistId &&
		effectiveVenueId &&
		proposedDate &&
		proposedTime &&
		(isArtistProposing ? myArtists?.length : myVenues?.length);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		const date = new Date(`${proposedDate}T${proposedTime}:00`);
		createMutation.mutate({
			artistId: effectiveArtistId,
			venueId: effectiveVenueId,
			proposedDate: date,
			proposedFee: proposedFee ? Number.parseInt(proposedFee, 10) : undefined,
			initialMessage: initialMessage || undefined,
		});
	};

	return (
		<div className="container mx-auto max-w-lg py-8">
			<p className="mb-4">
				{venueId && (
					<Link
						href={`/venue/${venueId}`}
						className="text-muted-foreground text-sm hover:text-foreground"
					>
						← Retour au lieu
					</Link>
				)}
				{artistId && (
					<Link
						href={`/artist/${artistId}`}
						className="text-muted-foreground text-sm hover:text-foreground"
					>
						← Retour à l&apos;artiste
					</Link>
				)}
			</p>
			<h1 className="mb-6 font-bold text-2xl">Proposer un booking</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				{isArtistProposing && myArtists && myArtists.length >= 1 && (
					<div className="space-y-2">
						<Label>Qui envoie la demande ? (profil artiste)</Label>
						<Select
							value={selectedArtistId || myArtists[0]?.id}
							onValueChange={setSelectedArtistId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Choisir un artiste" />
							</SelectTrigger>
							<SelectContent>
								{myArtists.map((a) => (
									<SelectItem key={a.id} value={a.id}>
										{a.stageName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-xs">
							La proposition sera envoyée au nom de cet artiste.
						</p>
					</div>
				)}
				{!isArtistProposing && myVenues && myVenues.length >= 1 && (
					<div className="space-y-2">
						<Label>Qui envoie la demande ? (lieu)</Label>
						<Select
							value={selectedVenueId || myVenues[0]?.id}
							onValueChange={setSelectedVenueId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Choisir un lieu" />
							</SelectTrigger>
							<SelectContent>
								{myVenues.map((v) => (
									<SelectItem key={v.id} value={v.id}>
										{v.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-xs">
							La proposition sera envoyée au nom de ce lieu.
						</p>
					</div>
				)}

				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor="date">Date</Label>
						<Input
							id="date"
							type="date"
							value={proposedDate}
							onChange={(e) => setProposedDate(e.target.value)}
							required
						/>
					</div>
					<div>
						<Label htmlFor="time">Heure</Label>
						<Input
							id="time"
							type="time"
							value={proposedTime}
							onChange={(e) => setProposedTime(e.target.value)}
							required
						/>
					</div>
				</div>

				{!isArtistProposing && (
					<div>
						<Label htmlFor="fee">Cachet proposé (€)</Label>
						<Input
							id="fee"
							type="number"
							min={0}
							value={proposedFee}
							onChange={(e) => setProposedFee(e.target.value)}
							placeholder="Optionnel"
						/>
					</div>
				)}

				<div>
					<Label htmlFor="message">Message</Label>
					<Textarea
						id="message"
						value={initialMessage}
						onChange={(e) => setInitialMessage(e.target.value)}
						placeholder="Présentez votre proposition..."
						rows={4}
						maxLength={2000}
					/>
				</div>

				<div className="flex gap-3 pt-4">
					<Button
						type="submit"
						disabled={!canSubmit || createMutation.isPending}
					>
						{createMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Envoyer la proposition"
						)}
					</Button>
					<Button type="button" variant="outline" asChild>
						<Link href="/dashboard/bookings">Annuler</Link>
					</Button>
				</div>
			</form>
		</div>
	);
}

export default function ProposeBookingPage() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto max-w-lg py-12 text-center">
					<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ProposeContent />
		</Suspense>
	);
}
