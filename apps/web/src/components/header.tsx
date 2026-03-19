"use client";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import UserMenu from "./user-menu";

type HeaderLink = {
	to: Route;
	label: string;
};

const SEARCH_VALUE_STORAGE_KEY = "rythmons:web:search-query";

function SearchHeaderControls({
	canSearchVenues,
	canSearchArtists,
}: {
	canSearchVenues: boolean;
	canSearchArtists: boolean;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const isSearchRoute = pathname === "/dashboard/search";
	const canAccessSearch = canSearchVenues || canSearchArtists;
	const [searchValue, setSearchValue] = useState("");

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (isSearchRoute) {
			const nextValue = searchParams.get("q") ?? "";
			setSearchValue(nextValue);
			window.sessionStorage.setItem(SEARCH_VALUE_STORAGE_KEY, nextValue);
			return;
		}

		setSearchValue(
			window.sessionStorage.getItem(SEARCH_VALUE_STORAGE_KEY) ?? "",
		);
	}, [isSearchRoute, searchParams]);

	if (!canAccessSearch) {
		return null;
	}

	function navigateToSearch(
		mutate: (params: URLSearchParams) => void,
		options?: { openFilters?: boolean },
	) {
		const params = new URLSearchParams(
			isSearchRoute ? searchParams.toString() : "",
		);
		mutate(params);
		if (options?.openFilters) {
			params.set("filters", "1");
		}
		const query = params.toString();
		const nextRoute = (
			query ? `/dashboard/search?${query}` : "/dashboard/search"
		) as Route;

		if (isSearchRoute) {
			router.replace(nextRoute, { scroll: false });
			return;
		}

		router.push(nextRoute, { scroll: false });
	}

	function submitSearch() {
		const trimmedQuery = searchValue.trim();
		if (typeof window !== "undefined") {
			window.sessionStorage.setItem(SEARCH_VALUE_STORAGE_KEY, trimmedQuery);
		}

		navigateToSearch((params) => {
			params.delete("page");
			if (trimmedQuery) {
				params.set("q", trimmedQuery);
			} else {
				params.delete("q");
			}
		});
	}

	function openFilters() {
		navigateToSearch(
			(params) => {
				params.delete("page");
				const trimmedQuery = searchValue.trim();
				if (trimmedQuery) {
					params.set("q", trimmedQuery);
				} else {
					params.delete("q");
				}
			},
			{ openFilters: true },
		);
	}

	return (
		<div className="flex w-full min-w-0 flex-1 items-center justify-center gap-2 px-0 lg:px-4">
			<div className="flex h-10 w-full max-w-xl items-center rounded-md border border-input bg-transparent pl-3 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
				<Search className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Input
					value={searchValue}
					onChange={(event) => setSearchValue(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							submitSearch();
						}
					}}
					aria-label="Rechercher un lieu, un artiste, une ville"
					placeholder="Rechercher un lieu, un artiste, une ville..."
					className="h-full border-0 bg-transparent pl-3 shadow-none focus-visible:ring-0"
				/>
			</div>
			<Button type="button" size="sm" variant="outline" onClick={openFilters}>
				<SlidersHorizontal className="h-4 w-4" />
				Filtres
			</Button>
		</div>
	);
}

export default function Header() {
	const { data: session } = authClient.useSession();
	const sessionRole = (session?.user as { role?: string | null } | undefined)
		?.role;
	const hasArtistRole = sessionRole === "ARTIST" || sessionRole === "BOTH";
	const hasOrganizerRole =
		sessionRole === "ORGANIZER" || sessionRole === "BOTH";
	const { data: artists } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user) && !hasArtistRole,
	});
	const { data: venues } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user) && !hasOrganizerRole,
	});
	const canSearchVenues = hasArtistRole || (artists?.length ?? 0) > 0;
	const canSearchArtists = hasOrganizerRole || (venues?.length ?? 0) > 0;
	const links: HeaderLink[] = [
		{ to: "/" as Route, label: "Accueil" },
		{ to: "/dashboard" as Route, label: "Tableau de bord" },
	];

	return (
		<div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			{/* ── Main bar ─────────────────────────────────────────── */}
			<div className="flex items-center gap-3 px-2 py-2">
				{/* Nav links — always visible */}
				<nav className="flex shrink-0 gap-2 text-sm lg:gap-4 lg:text-lg">
					{links.map(({ to, label }) => (
						<Link key={to} href={to}>
							{label}
						</Link>
					))}
				</nav>

				{/* Search — flex-1 so it fills available space without overflowing */}
				<div className="min-w-0 flex-1">
					<Suspense
						fallback={
							<div className="h-10 w-full animate-pulse rounded-md bg-muted" />
						}
					>
						<SearchHeaderControls
							canSearchVenues={canSearchVenues}
							canSearchArtists={canSearchArtists}
						/>
					</Suspense>
				</div>

				{/* User menu */}
				<div className="flex shrink-0 items-center gap-2">
					<UserMenu />
				</div>
			</div>
		</div>
	);
}
