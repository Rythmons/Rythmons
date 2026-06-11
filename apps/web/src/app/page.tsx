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

					<div className="flex max-w-xl flex-col space-y-6 sm:space-y-8">
						<p className="text-lg text-zinc-400 leading-relaxed sm:text-xl">
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
				</div>
			</div>
		</main>
	);
}
