"use client";

import { LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import UserMenu from "./user-menu";

function Logo() {
	return (
		<Link
			href={"/" as Route}
			className="group flex items-center"
			aria-label="Rythmons — Accueil"
		>
			{/* biome-ignore lint/performance/noImgElement: branding logo */}
			<img
				src="/logo.png"
				alt=""
				className="h-10 w-auto object-contain brightness-0 invert transition-transform active:scale-95"
			/>
		</Link>
	);
}

export default function Header() {
	const { data: session } = authClient.useSession();
	const router = useRouter();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const pathname = usePathname();
	const isHome = pathname === "/";
	const showDashboardNav = !!session?.user && !isHome;

	const closeMobile = () => setIsMobileMenuOpen(false);

	return (
		<header className="sticky top-0 z-50 w-full border-white/5 border-b bg-black/80 backdrop-blur-md">
			<div className="container mx-auto flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
				<div className="flex min-w-0 items-center gap-6">
					<Logo />
					<nav
						className="show-on-desktop min-w-0 items-center gap-6"
						aria-label="Navigation principale"
					>
						{!session?.user ? (
							<Link
								href={"/how-it-works" as Route}
								className="whitespace-nowrap font-medium text-sm text-white transition-colors hover:text-brand"
							>
								Comment ça marche ?
							</Link>
						) : null}
						{session?.user ? (
							<Link
								href={"/dashboard/search" as Route}
								className="whitespace-nowrap font-medium text-sm text-white/70 transition-colors hover:text-white"
							>
								Recherche
							</Link>
						) : null}
						{showDashboardNav && (
							<Link
								href={"/dashboard" as Route}
								className="whitespace-nowrap font-medium text-sm text-white/70 transition-colors hover:text-white"
							>
								Tableau de bord
							</Link>
						)}
					</nav>
				</div>

				<div className="ml-auto flex shrink-0 items-center gap-3">
					{session?.user ? (
						<UserMenu />
					) : (
						<div className="show-on-desktop items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								className="h-8 border-[color:var(--brand-primary)] px-4 font-bold text-white text-xs uppercase tracking-widest hover:bg-[color:var(--brand-primary)]/10"
								asChild
							>
								<Link href={"/login?signup=1" as Route}>Inscription</Link>
							</Button>
							<Button
								size="sm"
								className="h-8 bg-[color:var(--brand-primary)] px-4 font-bold text-white text-xs uppercase tracking-widest hover:brightness-110"
								asChild
							>
								<Link href={"/login" as Route}>Connexion</Link>
							</Button>
						</div>
					)}

					<Button
						variant="ghost"
						size="icon"
						type="button"
						className="hide-on-desktop text-white"
						aria-expanded={isMobileMenuOpen}
						aria-controls="site-mobile-nav"
						aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
						onClick={() => setIsMobileMenuOpen((o) => !o)}
					>
						{isMobileMenuOpen ? (
							<X className="h-6 w-6" aria-hidden />
						) : (
							<Menu className="h-6 w-6" aria-hidden />
						)}
					</Button>
				</div>
			</div>

			{isMobileMenuOpen && (
				<div
					id="site-mobile-nav"
					className="absolute top-16 right-0 left-0 flex flex-col gap-4 border-white/10 border-b bg-black p-6 md:hidden"
				>
					<Link
						href={"/how-it-works" as Route}
						className="font-medium text-lg"
						onClick={closeMobile}
					>
						Comment ça marche ?
					</Link>

					{session?.user ? (
						<div className="flex flex-col gap-3 border-white/5 border-t pt-4">
							<Link
								href={"/dashboard" as Route}
								className="flex items-center gap-2 font-medium text-lg text-white/90"
								onClick={closeMobile}
							>
								<LayoutDashboard className="h-5 w-5 text-brand" aria-hidden />
								Tableau de bord
							</Link>
							<Link
								href={"/dashboard/profile" as Route}
								className="flex items-center gap-2 font-medium text-lg text-white/90"
								onClick={closeMobile}
							>
								<User className="h-5 w-5 text-brand" aria-hidden />
								Mon profil
							</Link>
							<Button
								type="button"
								variant="outline"
								className="border-white/20 text-white"
								onClick={async () => {
									try {
										await authClient.signOut();
										closeMobile();
										router.push("/" as Route);
									} catch {
										toast.error(
											"Erreur lors de la déconnexion. Veuillez réessayer.",
										);
									}
								}}
							>
								<LogOut className="mr-2 h-4 w-4" aria-hidden />
								Se déconnecter
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-3 border-white/5 border-t pt-4">
							<Button
								variant="outline"
								className="border-[color:var(--brand-primary)] font-bold text-white uppercase tracking-widest"
								asChild
							>
								<Link href={"/login?signup=1" as Route} onClick={closeMobile}>
									Inscription
								</Link>
							</Button>
							<Button
								className="bg-[color:var(--brand-primary)] font-bold text-white uppercase tracking-widest hover:brightness-110"
								asChild
							>
								<Link href={"/login" as Route} onClick={closeMobile}>
									Connexion
								</Link>
							</Button>
						</div>
					)}
				</div>
			)}
		</header>
	);
}
