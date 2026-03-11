"use client";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import UserMenu from "./user-menu";

type HeaderLink = {
	to: Route;
	label: string;
};

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
		...(canSearchVenues || canSearchArtists
			? [{ to: "/dashboard/search" as Route, label: "Recherche" }]
			: []),
	];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} href={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
