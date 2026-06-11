"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

function getMonthRange(year: number, month: number) {
	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
	return { start, end };
}

function getDaysInMonth(year: number, month: number) {
	const first = new Date(year, month, 1);
	const last = new Date(year, month + 1, 0);
	const days: Date[] = [];
	for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
		days.push(new Date(d));
	}
	return days;
}

function dayKey(d: Date) {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function slotCoversDay(
	slot: {
		startDate: Date | string;
		endDate: Date | string;
		type: string;
		bookingId: string | null;
	},
	day: Date,
) {
	const d = new Date(day);
	d.setHours(0, 0, 0, 0);
	const start = new Date(slot.startDate);
	start.setHours(0, 0, 0, 0);
	const end = new Date(slot.endDate);
	end.setHours(23, 59, 59, 999);
	return d >= start && d <= end;
}

const CALENDAR_STATE_KEY = "rythmons:web:calendar-state";

function getInitialCalendarState() {
	const now = new Date();
	if (typeof window === "undefined") {
		return {
			year: now.getFullYear(),
			month: now.getMonth(),
			ownerType: "ARTIST" as const,
			ownerId: "",
		};
	}
	try {
		const raw = window.sessionStorage.getItem(CALENDAR_STATE_KEY);
		if (!raw)
			return {
				year: now.getFullYear(),
				month: now.getMonth(),
				ownerType: "ARTIST" as const,
				ownerId: "",
			};
		const parsed = JSON.parse(raw) as {
			year?: number;
			month?: number;
			ownerType?: "ARTIST" | "VENUE";
			ownerId?: string;
		};
		const year =
			typeof parsed.year === "number" && Number.isFinite(parsed.year)
				? parsed.year
				: now.getFullYear();
		const month =
			typeof parsed.month === "number" &&
			parsed.month >= 0 &&
			parsed.month <= 11
				? parsed.month
				: now.getMonth();
		const ownerType: "ARTIST" | "VENUE" =
			parsed.ownerType === "VENUE" ? "VENUE" : "ARTIST";
		const ownerId = typeof parsed.ownerId === "string" ? parsed.ownerId : "";
		return { year, month, ownerType, ownerId };
	} catch {
		return {
			year: now.getFullYear(),
			month: now.getMonth(),
			ownerType: "ARTIST" as const,
			ownerId: "",
		};
	}
}

type CalendarState = {
	year: number;
	month: number;
	ownerType: "ARTIST" | "VENUE";
	ownerId: string;
};

function CalendarPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const [calendarState, setCalendarState] = useState<CalendarState>(
		getInitialCalendarState,
	);
	const [focusedDayKey, setFocusedDayKey] = useState<string | null>(null);
	const { year, month, ownerType, ownerId } = calendarState;
	const setYear = useCallback((y: number) => {
		setCalendarState((s) => ({ ...s, year: y }));
	}, []);
	const setMonth = useCallback((m: number) => {
		setCalendarState((s) => ({ ...s, month: m }));
	}, []);
	const setOwnerType = useCallback((t: "ARTIST" | "VENUE") => {
		setCalendarState((s) => ({ ...s, ownerType: t }));
	}, []);
	const setOwnerId = useCallback((id: string) => {
		setCalendarState((s) => ({ ...s, ownerId: id }));
	}, []);

	const { data: session, isPending: sessionPending } = authClient.useSession();

	const { data: myArtists } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: !!session?.user,
	});
	const { data: myVenues } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: !!session?.user,
	});

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const saved = window.sessionStorage.getItem(CALENDAR_STATE_KEY);
			if (saved) {
				const state = JSON.parse(saved);
				setCalendarState(state);
			}
		} catch {
			// Ignore storage failures
		}
	}, []);

	useEffect(() => {
		const ownerTypeParam = searchParams.get("ownerType");
		const ownerIdParam = searchParams.get("ownerId");
		const dayParam = searchParams.get("day");

		if (!ownerTypeParam && !ownerIdParam && !dayParam) return;

		if (ownerTypeParam === "ARTIST" || ownerTypeParam === "VENUE") {
			setOwnerType(ownerTypeParam);
		}
		if (ownerIdParam) {
			setOwnerId(ownerIdParam);
		}
		if (dayParam) {
			const parsed = new Date(dayParam);
			if (!Number.isNaN(parsed.getTime())) {
				setYear(parsed.getFullYear());
				setMonth(parsed.getMonth());
				setFocusedDayKey(dayKey(parsed));
			}
		}
	}, [searchParams, setMonth, setOwnerId, setOwnerType, setYear]);

	useEffect(() => {
		if (
			ownerType === "VENUE" &&
			!ownerId &&
			myVenues &&
			myVenues.length > 0 &&
			myVenues[0]?.id
		) {
			setOwnerId(myVenues[0].id);
		}
	}, [ownerType, ownerId, myVenues, setOwnerId]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			window.sessionStorage.setItem(
				CALENDAR_STATE_KEY,
				JSON.stringify(calendarState),
			);
		} catch {
			// Ignore storage failures
		}
	}, [calendarState]);

	useEffect(() => {
		if (!sessionPending && !session?.user) {
			router.replace("/login");
		}
	}, [sessionPending, session, router]);

	const effectiveOwnerId =
		ownerType === "ARTIST"
			? ownerId || myArtists?.[0]?.id
			: ownerId || myVenues?.[0]?.id;

	const { start: rangeStart, end: rangeEnd } = getMonthRange(year, month);
	const { data: slots = [], isLoading: slotsLoading } = useQuery({
		...trpc.availability.list.queryOptions({
			ownerType,
			ownerId: effectiveOwnerId ?? "",
			startDate: rangeStart,
			endDate: rangeEnd,
		}),
		enabled: !!session?.user && !!effectiveOwnerId,
	});

	const upsertMutation = useMutation({
		...trpc.availability.upsert.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success("Créneau mis à jour");
		},
		onError: (e) => toast.error(e.message),
	});

	const deleteMutation = useMutation({
		...trpc.availability.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success("Créneau supprimé");
		},
		onError: (e) => toast.error(e.message),
	});

	const days = getDaysInMonth(year, month);
	const firstDay = new Date(year, month, 1).getDay();
	const padStart = (firstDay + 6) % 7;

	const getSlotForDay = useCallback(
		(day: Date) => {
			const covering = slots.filter((s) => slotCoversDay(s, day));
			return (
				covering.find((s) => s.type === "BOOKED") ??
				covering.find((s) => s.type === "UNAVAILABLE") ??
				covering.find((s) => s.type === "OPEN") ??
				covering[0]
			);
		},
		[slots],
	);

	const handleDayClick = useCallback(
		(day: Date) => {
			if (!effectiveOwnerId) return;
			setFocusedDayKey(dayKey(day));
			const slot = getSlotForDay(day);
			const start = new Date(day);
			start.setHours(0, 0, 0, 0);
			const end = new Date(day);
			end.setHours(23, 59, 59, 999);

			if (slot?.type === "BOOKED") {
				toast.info("Ce créneau est réservé par un booking confirmé.");
				return;
			}

			if (slot && !slot.bookingId) {
				deleteMutation.mutate({ id: slot.id });
				return;
			}

			upsertMutation.mutate({
				ownerType,
				ownerId: effectiveOwnerId,
				startDate: start,
				endDate: end,
				type: ownerType === "ARTIST" ? "UNAVAILABLE" : "OPEN",
			});
		},
		[
			effectiveOwnerId,
			ownerType,
			getSlotForDay,
			upsertMutation,
			deleteMutation,
		],
	);

	if (sessionPending || !session?.user) {
		return (
			<div className="container mx-auto max-w-4xl py-12 text-center">
				<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const hasArtists = myArtists && myArtists.length > 0;
	const hasVenues = myVenues && myVenues.length > 0;

	if (!hasArtists && !hasVenues) {
		return (
			<div className="container mx-auto max-w-4xl py-12">
				<p className="text-muted-foreground">
					Créez un profil artiste ou un lieu pour gérer votre calendrier.
				</p>
			</div>
		);
	}

	const ownerOptions =
		ownerType === "ARTIST"
			? (myArtists ?? []).map((a) => ({ id: a.id, name: a.stageName }))
			: (myVenues ?? []).map((v) => ({ id: v.id, name: v.name }));

	const focusedDay =
		focusedDayKey != null
			? (days.find((d) => dayKey(d) === focusedDayKey) ?? null)
			: null;

	return (
		<div className="container mx-auto max-w-4xl py-8">
			<p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
				<Link
					href="/dashboard"
					className="text-muted-foreground hover:text-foreground"
				>
					← Tableau de bord
				</Link>
				<span className="text-muted-foreground">·</span>
				<Link
					href="/dashboard/bookings"
					className="text-muted-foreground hover:text-foreground"
				>
					Propositions
				</Link>
			</p>
			<h1 className="mb-6 font-bold text-2xl">Calendrier</h1>

			<div className="mb-6 flex flex-wrap items-center gap-4">
				{hasArtists && hasVenues && (
					<Select
						value={ownerType}
						onValueChange={(v) => {
							setOwnerType(v as "ARTIST" | "VENUE");
							setOwnerId("");
						}}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ARTIST">En tant qu&apos;artiste</SelectItem>
							<SelectItem value="VENUE">En tant que lieu</SelectItem>
						</SelectContent>
					</Select>
				)}
				{ownerOptions.length > 1 ? (
					<Select
						value={ownerId || ownerOptions[0]?.id}
						onValueChange={setOwnerId}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Sélectionner" />
						</SelectTrigger>
						<SelectContent>
							{ownerOptions.map((o) => (
								<SelectItem key={o.id} value={o.id}>
									{o.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : null}
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							const d = new Date(year, month - 1);
							setYear(d.getFullYear());
							setMonth(d.getMonth());
						}}
					>
						← Mois préc.
					</Button>
					<span className="flex items-center px-3 font-medium">
						{new Date(year, month).toLocaleDateString("fr-FR", {
							month: "long",
							year: "numeric",
						})}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							const d = new Date(year, month + 1);
							setYear(d.getFullYear());
							setMonth(d.getMonth());
						}}
					>
						Mois suiv. →
					</Button>
				</div>
			</div>

			<p className="mb-4 text-muted-foreground text-sm">
				{ownerType === "ARTIST"
					? "Cliquez sur un jour pour le marquer comme indisponible (ou pour retirer le créneau)."
					: "Cliquez sur un jour pour le marquer comme ouvert à la programmation (ou pour retirer le créneau)."}
			</p>

			{ownerType === "VENUE" && focusedDay ? (
				<div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
					<p className="font-medium">Action requise</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Ouvrez cette date pour pouvoir accepter le booking.
					</p>
					<div className="mt-3 flex flex-wrap gap-3">
						<Button
							onClick={() => {
								if (!effectiveOwnerId) return;
								const start = new Date(focusedDay);
								start.setHours(0, 0, 0, 0);
								const end = new Date(focusedDay);
								end.setHours(23, 59, 59, 999);
								upsertMutation.mutate({
									ownerType: "VENUE",
									ownerId: effectiveOwnerId,
									startDate: start,
									endDate: end,
									type: "OPEN",
								});
							}}
							disabled={upsertMutation.isPending || !effectiveOwnerId}
						>
							Ouvrir le{" "}
							{focusedDay.toLocaleDateString("fr-FR", { dateStyle: "long" })}
						</Button>
					</div>
				</div>
			) : null}

			<div className="mb-4 flex gap-6 text-sm">
				<span className="flex items-center gap-2">
					<span className="h-4 w-4 rounded bg-red-500/30" />
					{ownerType === "ARTIST" ? "Indisponible" : "Fermé"}
				</span>
				{ownerType === "VENUE" && (
					<span className="flex items-center gap-2">
						<span className="h-4 w-4 rounded bg-green-500/30" />
						Ouvert
					</span>
				)}
				<span className="flex items-center gap-2">
					<span className="h-4 w-4 rounded bg-blue-500/30" />
					Booking confirmé
				</span>
			</div>

			{slotsLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : (
				<div className="rounded-lg border bg-card">
					<div className="grid grid-cols-7 gap-px border-b bg-muted/30">
						{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((w) => (
							<div
								key={w}
								className="bg-background p-2 text-center font-medium text-muted-foreground text-sm"
							>
								{w}
							</div>
						))}
					</div>
					<div className="grid grid-cols-7 gap-px bg-muted/30">
						{Array.from({ length: padStart }, (_, i) => {
							// Padding cells represent the days of the previous month.
							// Use a stable key derived from the actual date (not the index)
							// to avoid React/Biome warnings and potential state mismatches.
							const padDate = new Date(year, month, 1 - padStart + i);
							return (
								<div
									key={dayKey(padDate)}
									className="min-h-[80px] bg-background"
								/>
							);
						})}
						{days.map((day) => {
							const slot = getSlotForDay(day);
							const isBooked = slot?.type === "BOOKED";
							const isUnavailable = slot?.type === "UNAVAILABLE";
							const isOpen = slot?.type === "OPEN";
							const isToday = dayKey(day) === dayKey(new Date());
							const isFocused =
								focusedDayKey != null && dayKey(day) === focusedDayKey;
							const bg = isBooked
								? "bg-blue-500/40 hover:bg-blue-500/50"
								: isUnavailable
									? "bg-red-500/40 hover:bg-red-500/50"
									: isOpen
										? "bg-green-500/40 hover:bg-green-500/50"
										: "hover:bg-muted/50";
							return (
								<button
									key={dayKey(day)}
									type="button"
									className={`relative min-h-[80px] p-2 text-left text-sm transition-colors ${bg} ${
										isToday ? "border-2 border-primary" : ""
									} ${isFocused ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
									onClick={() => handleDayClick(day)}
								>
									<div className="flex items-center justify-between font-medium">
										<span>{day.getDate()}</span>
										{isToday && (
											<span className="rounded bg-primary px-1 text-[10px] text-primary-foreground">
												Aujourd&apos;hui
											</span>
										)}
									</div>
									{slot?.booking && (
										<div className="mt-1 space-y-0.5 truncate text-muted-foreground text-xs">
											<span className="block truncate">
												{slot.booking.artist?.stageName ??
													slot.booking.venue?.name ??
													"Booking"}
											</span>
											{slot.booking.id && (
												<Link
													href={`/dashboard/bookings/${slot.booking.id}`}
													className="block font-medium text-primary hover:underline"
													onClick={(e) => e.stopPropagation()}
												>
													Voir la proposition
												</Link>
											)}
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

export default function CalendarPage() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto max-w-4xl py-12 text-center">
					<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<CalendarPageContent />
		</Suspense>
	);
}
