"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import UserMenu from "./user-menu";

export default function Header() {
	const { data: session } = authClient.useSession();
	const sessionRole = (session?.user as { role?: string | null } | undefined)
		?.role;
	const canSearchVenues = sessionRole === "ARTIST" || sessionRole === "BOTH";
	const links = [
		{ to: "/", label: "Accueil" },
		{ to: "/dashboard", label: "Tableau de bord" },
		...(canSearchVenues
			? [{ to: "/dashboard/search", label: "Rechercher des lieux" }]
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
