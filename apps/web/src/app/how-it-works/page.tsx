import { Calendar, Search, User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Comment ça marche ? — Rythmons",
	description:
		"Créez votre profil, trouvez des partenaires et sécurisez vos dates avec le calendrier Rythmons.",
};

export default function HowItWorks() {
	const steps = [
		{
			id: 1,
			title: "Étape 1 — Profil",
			description:
				"Créez votre profil artiste ou votre fiche lieu : bio, styles, capacité, contacts. Une identité claire pour être trouvé par les bons partenaires.",
			color: "#D60D4D",
			Icon: User,
		},
		{
			id: 2,
			title: "Étape 2 — Rencontre",
			description:
				"Explorez la carte et les profils, puis proposez une date ou répondez à une demande. Les échanges restent centralisés sur Rythmons.",
			color: "#5B005B",
			Icon: Search,
		},
		{
			id: 3,
			title: "Étape 3 — Confirmation",
			description:
				"Validez la réservation et suivez votre calendrier partagé : propositions, contre-propositions et statuts jusqu'à la date figée.",
			color: "#210021",
			Icon: Calendar,
		},
	];

	return (
		<main className="flex min-h-[calc(100vh-64px)] flex-col items-center overflow-y-auto bg-[#0B000E] py-12 text-white">
			<div className="w-full max-w-5xl px-6">
				<h1 className="mb-10 text-center font-display font-medium text-3xl text-[color:var(--brand-primary)] tracking-tight sm:text-4xl lg:text-5xl">
					Comment ça marche ?
				</h1>

				<div className="flex flex-col pb-8">
					{steps.map((step, index) => {
						const Icon = step.Icon;
						return (
							<div
								key={step.id}
								className="flex flex-row items-center py-6 lg:min-h-[200px] lg:py-2"
							>
								<div className="flex flex-1 justify-end pr-6 lg:pr-16">
									<div
										className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-[6px] border-[color:var(--brand-primary)] bg-white shadow-xl lg:h-28 lg:w-28"
										aria-hidden
									>
										<Icon
											className="h-10 w-10 text-[color:var(--brand-primary)] lg:h-14 lg:w-14"
											strokeWidth={1.25}
										/>
									</div>
								</div>

								<div className="relative flex h-full w-16 flex-col items-center justify-center lg:w-32">
									{index !== 0 && (
										<div className="absolute top-0 h-1/2 w-0.5 bg-white/80" />
									)}
									{index !== steps.length - 1 && (
										<div className="absolute bottom-0 h-1/2 w-0.5 bg-white/80" />
									)}

									<div
										className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold font-sans text-lg shadow-2xl lg:h-14 lg:w-14 lg:text-2xl"
										style={{ backgroundColor: step.color }}
									>
										{step.id}
									</div>
								</div>

								<div className="flex flex-1 flex-col justify-center pl-6 lg:pl-16">
									<h2 className="mb-2 font-bold font-sans text-[color:var(--brand-primary)] text-lg tracking-wide lg:text-2xl">
										{step.title}
									</h2>
									<p className="max-w-md font-light font-sans text-xs text-zinc-400 leading-relaxed lg:text-sm">
										{step.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</main>
	);
}
