import { Play } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth-server";

export const metadata: Metadata = {
	title: "Rythmons — Par les indés, pour les indés",
	description: "La plateforme de booking intuitive pour la scène locale.",
};

const ctaPrimary =
	"h-14 w-full min-w-0 bg-[color:var(--brand-primary)] px-8 text-base font-display font-bold uppercase tracking-widest text-white shadow-[0_0_28px_rgba(235,13,65,0.35)] rounded-[13px] transition-all hover:brightness-110 hover:shadow-[0_0_40px_rgba(235,13,65,0.45)] sm:w-auto sm:px-12";

const ctaOutline =
	"h-14 w-full min-w-0 border-white bg-transparent px-8 text-base font-display font-bold uppercase tracking-widest text-white rounded-[13px] transition-all hover:bg-white/10 sm:w-auto sm:px-12";

export default async function Home() {
	const { data: session } = await getServerSession();

	return (
		<main className="flex min-h-[calc(100vh-64px)] items-center bg-black text-white">
			<div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:py-24">
				<div className="space-y-6 lg:space-y-10">
					<div className="space-y-2">
						<h1 className="whitespace-nowrap font-display text-5xl not-italic tracking-tighter sm:text-7xl lg:text-8xl">
							RYTHMONS !
						</h1>
						<p className="font-bold font-display text-[color:var(--brand-primary)] text-lg uppercase tracking-[0.15em] sm:text-xl sm:tracking-[0.25em]">
							Par les indés, pour les indés
						</p>
					</div>

					<div className="grid items-start gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
						<div className="order-2 flex flex-col space-y-6 lg:order-1 lg:space-y-8">
							<p className="max-w-xl text-lg text-zinc-400 leading-relaxed sm:text-xl">
								La plateforme de booking qui simplifie la rencontre entre les
								artistes locaux et les lieux de diffusion. Ne laissez plus la
								logistique freiner votre talent.
							</p>

							<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:gap-4 sm:pt-4">
								{session?.user ? (
									<Button size="lg" className={ctaPrimary} asChild>
										<Link href={"/dashboard" as Route}>Tableau de bord</Link>
									</Button>
								) : (
									<>
										<Button size="lg" className={ctaPrimary} asChild>
											<Link href={"/login" as Route}>Connexion</Link>
										</Button>
										<Button
											size="lg"
											variant="outline"
											className={ctaOutline}
											asChild
										>
											<Link href={"/login?signup=1" as Route}>Inscription</Link>
										</Button>
									</>
								)}
							</div>
						</div>

						<div className="order-1 space-y-6 lg:order-2">
							<div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-black shadow-2xl shadow-black/40">
								<video
									className="h-full w-full object-cover"
									autoPlay
									muted
									loop
									playsInline
									poster="/hero-poster.svg"
									// Extensions (zoom, lecteur, etc.) peuvent modifier le DOM avant hydrate
									suppressHydrationWarning
								>
									<source src="/hero.mp4" type="video/mp4" />
								</video>
								<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.55))]" />
								<div className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3">
									<p className="font-display text-white/90 text-xs uppercase tracking-[0.2em] sm:text-sm">
										Calendrier & réservations
									</p>
									<Link
										href={"/how-it-works" as Route}
										className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 font-medium text-white/90 text-xs backdrop-blur-sm transition-colors hover:bg-black/55"
									>
										<Play
											className="h-3.5 w-3.5 text-[color:var(--brand-primary)]"
											aria-hidden
										/>
										Comment ça marche ?
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
