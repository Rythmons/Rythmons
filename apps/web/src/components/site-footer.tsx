import type { Route } from "next";
import Link from "next/link";

export function SiteFooter() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-white/10 border-t bg-black/60 backdrop-blur-sm">
			<div className="container mx-auto flex flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
				<p className="text-center text-sm text-zinc-500 md:text-left">
					© {year} Rythmons. Tous droits réservés.
				</p>
				<nav
					className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400"
					aria-label="Liens de pied de page"
				>
					<Link
						href={"/how-it-works" as Route}
						className="transition-colors hover:text-[color:var(--brand-primary)]"
					>
						Comment ça marche ?
					</Link>
					<Link
						href={"/cgu" as Route}
						className="transition-colors hover:text-[color:var(--brand-primary)]"
					>
						CGU
					</Link>
					<Link
						href={"/login" as Route}
						className="transition-colors hover:text-[color:var(--brand-primary)]"
					>
						Connexion
					</Link>
				</nav>
			</div>
		</footer>
	);
}
