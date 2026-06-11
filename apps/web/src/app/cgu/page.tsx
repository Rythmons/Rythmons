import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Conditions générales d'utilisation — Rythmons",
};

export default function CguPage() {
	return (
		<main className="mx-auto max-w-3xl px-6 py-12">
			<p className="mb-6">
				<Link
					href="/login"
					className="text-muted-foreground text-sm hover:text-foreground"
				>
					← Retour à la connexion
				</Link>
				{" · "}
				<Link
					href="/"
					className="text-muted-foreground text-sm hover:text-foreground"
				>
					Accueil
				</Link>
			</p>
			<h1 className="mb-8 font-bold text-3xl">
				Conditions générales d'utilisation
			</h1>

			<section className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
				<p className="text-muted-foreground text-sm">
					Dernière mise à jour : mars 2026
				</p>

				<h2 className="font-semibold text-foreground text-xl">1. Objet</h2>
				<p>
					Les présentes conditions générales d'utilisation (CGU) régissent
					l'accès et l'utilisation de la plateforme Rythmons, accessible à
					l'adresse rythmons.com, éditée par la société Rythmons.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					2. Acceptation des conditions
				</h2>
				<p>
					L'utilisation de la plateforme implique l'acceptation pleine et
					entière des présentes CGU. Si vous n'acceptez pas ces conditions,
					veuillez ne pas utiliser la plateforme.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					3. Description du service
				</h2>
				<p>
					Rythmons est une plateforme de mise en relation entre artistes et
					organisateurs de concerts / salles de spectacle. Elle permet aux
					artistes de présenter leur profil et aux organisateurs de trouver des
					talents correspondant à leurs événements.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					4. Accès au service
				</h2>
				<p>
					L'accès à la plateforme est réservé aux personnes majeures. L'
					inscription est gratuite. Vous êtes responsable de la confidentialité
					de vos identifiants.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					5. Données personnelles
				</h2>
				<p>
					Les données collectées sont traitées conformément à notre politique de
					confidentialité et au Règlement général sur la protection des données
					(RGPD). Vous disposez d'un droit d'accès, de rectification et de
					suppression de vos données.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					6. Propriété intellectuelle
				</h2>
				<p>
					L'ensemble des contenus de la plateforme (textes, images, logos, code
					source) sont la propriété exclusive de Rythmons et sont protégés par
					le droit de la propriété intellectuelle.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					7. Responsabilité
				</h2>
				<p>
					Rythmons s'efforce d'assurer la disponibilité et la sécurité de la
					plateforme mais ne peut garantir une disponibilité ininterrompue.
					Rythmons ne saurait être tenu responsable des dommages indirects
					résultant de l'utilisation de la plateforme.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					8. Modification des CGU
				</h2>
				<p>
					Rythmons se réserve le droit de modifier les présentes CGU à tout
					moment. Les utilisateurs seront informés des modifications par e-mail
					ou par une notification sur la plateforme.
				</p>

				<h2 className="font-semibold text-foreground text-xl">
					9. Droit applicable
				</h2>
				<p>
					Les présentes CGU sont soumises au droit français. Tout litige sera
					soumis à la compétence exclusive des tribunaux compétents.
				</p>

				<h2 className="font-semibold text-foreground text-xl">10. Contact</h2>
				<p>
					Pour toute question relative aux présentes CGU, contactez-nous à
					l'adresse : contact@rythmons.com
				</p>
			</section>
		</main>
	);
}
