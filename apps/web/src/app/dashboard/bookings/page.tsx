"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

const STATUS_LABELS: Record<string, string> = {
	PENDING: "En attente",
	ACCEPTED: "Acceptée",
	REFUSED: "Refusée",
	CANCELLED: "Annulée",
};

export default function BookingsPage() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { data: bookings, isLoading } = useQuery({
		...trpc.booking.listMine.queryOptions(),
		enabled: !!session?.user,
	});

	if (sessionPending || !session?.user) {
		return (
			<div className="container mx-auto max-w-4xl py-12 text-center">
				<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-4xl py-12 text-center">
				<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const myUserId = session.user.id;
	const list = Array.isArray(bookings) ? bookings : [];

	return (
		<div className="container mx-auto max-w-4xl py-8">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="font-bold text-2xl">Propositions de booking</h1>
				<Button asChild>
					<Link href="/dashboard/bookings/propose">Nouvelle proposition</Link>
				</Button>
			</div>

			{list.length === 0 ? (
				<div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
					<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<p className="text-muted-foreground">
						Vous n'avez pas encore de proposition.
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						Utilisez le bouton &quot;Proposer un booking&quot; sur une fiche
						artiste ou lieu pour en créer une.
					</p>
				</div>
			) : (
				<ul className="space-y-3">
					{list.map((b) => {
						const isSent = b.createdByUserId === myUserId;
						const otherName = isSent
							? b.venue.name
							: ((b.artist as { stageName?: string }).stageName ?? "—");
						const otherHref = isSent
							? `/venue/${b.venue.id}`
							: `/artist/${b.artist.id}`;

						return (
							<li
								key={b.id}
								className="flex items-center justify-between rounded-lg border bg-card p-4"
							>
								<div className="flex items-center gap-4">
									<div>
										<p className="font-medium">
											{isSent ? "Vers" : "De"} :{" "}
											<Link
												href={otherHref as Route}
												className="text-primary hover:underline"
											>
												{otherName}
											</Link>
										</p>
										<p className="text-muted-foreground text-sm">
											{new Date(b.proposedDate).toLocaleString("fr-FR", {
												dateStyle: "medium",
												timeStyle: "short",
											})}
											{b.proposedFee != null && ` • ${b.proposedFee} €`}
										</p>
									</div>
									<span
										className={`rounded-full px-2 py-1 font-medium text-xs ${
											b.status === "PENDING"
												? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
												: b.status === "ACCEPTED"
													? "bg-green-500/20 text-green-600 dark:text-green-400"
													: b.status === "REFUSED"
														? "bg-red-500/20 text-red-600 dark:text-red-400"
														: "bg-muted text-muted-foreground"
										}`}
									>
										{STATUS_LABELS[b.status] ?? b.status}
									</span>
								</div>
								<Button variant="outline" size="sm" asChild>
									<Link href={`/dashboard/bookings/${b.id}`}>Voir</Link>
								</Button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
