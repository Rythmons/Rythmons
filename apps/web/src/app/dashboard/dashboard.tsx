"use client";

import type { Session } from "@rythmons/auth/types";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Mic2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

export default function Dashboard({ session }: { session: Session }) {
	const router = useRouter();
	console.log("Dashboard Session:", session.user);
	const userRole = session.user.role;

	// Fetch Venues (Always fetch if we don't know the role yet, or if organizer)
	const { data: venues, isLoading: venuesLoading } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: !!session.user,
	});

	// Fetch Artists (Always fetch if we don't know the role yet, or if artist)
	const { data: artists, isLoading: artistsLoading } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: !!session.user,
	});

	const isLoading = venuesLoading || artistsLoading;

	if (isLoading) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Chargement de votre espace...
			</div>
		);
	}

	const hasVenues = venues && venues.length > 0;
	const hasArtists = artists && artists.length > 0;

	// --- ONBOARDING LOGIC ---

	// Case 1: Explicit Organizer with no venues
	if (userRole === "ORGANIZER" && !hasVenues) {
		return (
			<div className="mx-auto max-w-3xl py-12">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl">
						Bienvenue, {session.user.name} !
					</h1>
					<p className="text-lg text-muted-foreground">
						Votre compte organisateur est prêt. Il ne vous reste plus qu'à
						configurer votre établissement.
					</p>
				</div>
				<Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
					<CardHeader>
						<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
							<Building2 className="h-6 w-6 text-primary" />
						</div>
						<CardTitle className="text-2xl">Créez votre premier lieu</CardTitle>
						<CardDescription className="text-base">
							Pour recevoir des propositions d'artistes et gérer vos événements,
							vous devez créer une fiche pour votre lieu.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="mb-6 list-disc space-y-2 pl-5 text-muted-foreground text-sm">
							<li>Définissez votre capacité et vos équipements</li>
							<li>Ajoutez des photos et un logo</li>
							<li>Précisez vos genres musicaux préférés</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button asChild size="lg" className="w-full sm:w-auto">
							<Link href="/dashboard/venue">
								Commencer la configuration{" "}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Case 2: Explicit Artist with no profiles
	if (userRole === "ARTIST" && !hasArtists) {
		return (
			<div className="mx-auto max-w-3xl py-12">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl">
						Bienvenue, {session.user.name} !
					</h1>
					<p className="text-lg text-muted-foreground">
						Votre compte artiste est prêt. Créez votre profil pour commencer à
						démarcher des lieux.
					</p>
				</div>
				<Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
					<CardHeader>
						<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
							<Mic2 className="h-6 w-6 text-primary" />
						</div>
						<CardTitle className="text-2xl">
							Créez votre profil artiste
						</CardTitle>
						<CardDescription className="text-base">
							Présentez votre projet musical pour convaincre les organisateurs.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="mb-6 list-disc space-y-2 pl-5 text-muted-foreground text-sm">
							<li>
								Ajoutez votre biographie et vos liens (Spotify, YouTube...)
							</li>
							<li>Définissez votre style musical</li>
							<li>Indiquez vos conditions techniques et tarifaires</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button asChild size="lg" className="w-full sm:w-auto">
							<Link href="/dashboard/artist">
								Créer mon profil artiste <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Case 3: Explicit Media
	if (userRole === "MEDIA") {
		return (
			<div className="mx-auto max-w-3xl py-12">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl">
						Bienvenue, {session.user.name} !
					</h1>
					<p className="text-lg text-muted-foreground">
						Votre compte Média est prêt. Explorez les artistes et les lieux pour
						vos prochaines programmations ou articles.
					</p>
				</div>
				<div className="rounded-xl border border-dashed p-12 text-center">
					<p className="text-muted-foreground">
						L'espace Média dédié est en cours d'amélioration.
					</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard">Accéder au tableau de bord</Link>
					</Button>
				</div>
			</div>
		);
	}

	// Case 4: Explicit Tech/Service
	if (userRole === "TECH_SERVICE") {
		return (
			<div className="mx-auto max-w-3xl py-12">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl">
						Bienvenue, {session.user.name} !
					</h1>
					<p className="text-lg text-muted-foreground">
						Votre compte Prestataire est prêt. Bientôt, vous pourrez proposer
						vos services (son, lumière, backline) directement sur la plateforme.
					</p>
				</div>
				<div className="rounded-xl border border-dashed p-12 text-center">
					<p className="text-muted-foreground">
						L'espace Prestataire dédié est en cours d'amélioration.
					</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard">Accéder au tableau de bord</Link>
					</Button>
				</div>
			</div>
		);
	}

	// Case 5: No specific role defined OR no profiles created yet (catch-all onboarding)
	if (!hasVenues && !hasArtists) {
		return (
			<div className="mx-auto max-w-4xl py-12">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl">Bienvenue sur Rythmons !</h1>
					<p className="text-lg text-muted-foreground">
						Pour commencer, choisissez ce que vous souhaitez gérer ou explorer.
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card className="flex flex-col border-primary/20 bg-gradient-to-b from-primary/5 to-transparent transition-colors hover:border-primary/50">
						<CardHeader>
							<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
								<Building2 className="h-6 w-6 text-primary" />
							</div>
							<CardTitle className="text-sm">Gérer un Lieu</CardTitle>
						</CardHeader>
						<CardContent className="flex-1">
							<p className="text-muted-foreground text-xs">
								Bar, Salle de concert...
							</p>
						</CardContent>
						<CardFooter>
							<Button asChild size="sm" className="w-full">
								<Link href="/dashboard/venue">
									Créer <ArrowRight className="ml-2 h-3 w-3" />
								</Link>
							</Button>
						</CardFooter>
					</Card>

					<Card className="flex flex-col border-primary/20 bg-gradient-to-b from-primary/5 to-transparent transition-colors hover:border-primary/50">
						<CardHeader>
							<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
								<Mic2 className="h-6 w-6 text-primary" />
							</div>
							<CardTitle className="text-sm">Être Artiste</CardTitle>
						</CardHeader>
						<CardContent className="flex-1">
							<p className="text-muted-foreground text-xs">
								Groupe, Solo, DJ...
							</p>
						</CardContent>
						<CardFooter>
							<Button asChild size="sm" className="w-full">
								<Link href="/dashboard/artist">
									Créer <ArrowRight className="ml-2 h-3 w-3" />
								</Link>
							</Button>
						</CardFooter>
					</Card>

					<Card className="flex flex-col border-muted bg-card/50 opacity-80">
						<CardHeader>
							<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
								<ArrowRight className="h-6 w-6 text-muted-foreground" />
							</div>
							<CardTitle className="text-muted-foreground text-sm">
								Média / Radio
							</CardTitle>
						</CardHeader>
						<CardContent className="flex-1">
							<p className="text-muted-foreground text-xs italic">
								Arrive bientôt...
							</p>
						</CardContent>
					</Card>

					<Card className="flex flex-col border-muted bg-card/50 opacity-80">
						<CardHeader>
							<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
								<ArrowRight className="h-6 w-6 text-muted-foreground" />
							</div>
							<CardTitle className="text-muted-foreground text-sm">
								Prestataire
							</CardTitle>
						</CardHeader>
						<CardContent className="flex-1">
							<p className="text-muted-foreground text-xs italic">
								Arrive bientôt...
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// DEFAULT DASHBOARD (User has some profiles)
	return (
		<div className="container mx-auto min-h-screen px-4 py-8">
			{/* Header Section */}
			<div className="mb-8">
				<h1 className="font-display text-4xl text-white">Tableau de bord</h1>
				<p className="text-white/60">Gérez vos activités et vos profils.</p>
			</div>

			{/* Two Column Layout for Desktop */}
			<div className="grid gap-8 lg:grid-cols-2">
				{/* Venues Section */}
				{(userRole === "ORGANIZER" ||
					userRole === "BOTH" ||
					!userRole ||
					hasVenues) && (
					<section className="rounded-2xl bg-black/20 p-6">
						<div className="mb-6 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
								<Building2 className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h2 className="font-semibold text-white text-xl">Mes Lieux</h2>
								<p className="text-sm text-white/50">
									{venues?.length || 0} lieu(x) géré(s)
								</p>
							</div>
						</div>

						{venues && venues.length > 0 ? (
							<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
								{venues.map((venue) => (
									<Link
										key={venue.id}
										href={`/venue/${venue.id}` as any}
										className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:shadow-primary/10 hover:shadow-xl"
									>
										{/* Cover Image */}
										<div className="relative aspect-video overflow-hidden">
											{venue.photoUrl ? (
												<img
													src={venue.photoUrl}
													alt=""
													className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
												/>
											) : (
												<div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20" />
											)}
											<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

											{/* Logo overlay */}
											<div className="absolute bottom-0 left-4 translate-y-1/2">
												<div className="h-16 w-16 overflow-hidden rounded-xl border-4 border-black/50 bg-black/50 backdrop-blur-sm">
													{venue.logoUrl ? (
														<img
															src={venue.logoUrl}
															alt=""
															className="h-full w-full object-contain"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center">
															<Building2 className="h-6 w-6 text-white/50" />
														</div>
													)}
												</div>
											</div>
										</div>

										{/* Content */}
										<div className="p-4 pt-10">
											<h3 className="truncate font-semibold text-white">
												{venue.name}
											</h3>
											<p className="mt-1 flex items-center gap-1 text-sm text-white/50">
												<span>{venue.city}</span>
												{venue.venueType && (
													<>
														<span className="text-white/30">•</span>
														<span>{getVenueTypeLabel(venue.venueType)}</span>
													</>
												)}
											</p>
										</div>

										{/* Hover overlay */}
										<div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100">
											<span className="rounded-full bg-white/20 px-4 py-2 font-medium text-sm text-white backdrop-blur-sm">
												Voir le profil
											</span>
										</div>
									</Link>
								))}

								{/* Add new venue card */}
								<Link
									href="/dashboard/venue?new=true"
									className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-white/20 border-dashed bg-white/5 p-8 text-white/50 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:text-white"
								>
									<Plus className="mb-2 h-10 w-10" />
									<span className="font-medium text-sm">Ajouter un lieu</span>
								</Link>
							</div>
						) : (
							<div className="rounded-2xl border border-white/20 border-dashed bg-white/5 p-12 text-center">
								<Building2 className="mx-auto mb-4 h-12 w-12 text-white/30" />
								<p className="mb-4 text-white/50">
									Vous n'avez pas encore de lieu
								</p>
								<Button asChild>
									<Link href="/dashboard/venue?new=true">
										<Plus className="mr-2 h-4 w-4" /> Créer mon premier lieu
									</Link>
								</Button>
							</div>
						)}
					</section>
				)}

				{/* Artists Section - Show if Artist OR has artists OR role is missing/both */}
				{(userRole === "ARTIST" ||
					userRole === "BOTH" ||
					!userRole ||
					hasArtists) && (
					<section className="mb-10">
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20">
									<Mic2 className="h-5 w-5 text-secondary" />
								</div>
								<div>
									<h2 className="font-semibold text-white text-xl">
										Mes Projets Artistes
									</h2>
									<p className="text-sm text-white/50">
										{artists?.length || 0} projet(s) géré(s)
									</p>
								</div>
							</div>
							<Button
								asChild
								variant="outline"
								className="border-white/20 text-white hover:bg-white/10"
							>
								<Link href="/dashboard/artist">
									<Plus className="mr-2 h-4 w-4" /> Nouveau projet
								</Link>
							</Button>
						</div>
						{artists && artists.length > 0 ? (
							<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
								{(artists as any[]).map((artist) => (
									<Link
										key={artist.id}
										href={`/dashboard/artist?id=${artist.id}`}
										className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-secondary/50 hover:shadow-secondary/10 hover:shadow-xl"
									>
										{/* Cover/Photo */}
										<div className="relative aspect-video overflow-hidden">
											{artist.photoUrl ? (
												<img
													src={artist.photoUrl}
													alt=""
													className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
												/>
											) : (
												<div className="h-full w-full bg-gradient-to-br from-secondary/20 to-accent/20" />
											)}
											<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
										</div>

										{/* Content */}
										<div className="p-4">
											<div className="flex items-center gap-3">
												<div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/20 bg-black/50">
													{artist.photoUrl ? (
														<img
															src={artist.photoUrl}
															alt=""
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center">
															<Mic2 className="h-5 w-5 text-white/50" />
														</div>
													)}
												</div>
												<div>
													<h3 className="truncate font-semibold text-white">
														{artist.stageName}
													</h3>
													<p className="text-sm text-white/50">Artiste</p>
												</div>
											</div>
										</div>

										{/* Hover overlay */}
										<div className="absolute inset-0 flex items-center justify-center bg-secondary/10 opacity-0 transition-opacity group-hover:opacity-100">
											<span className="rounded-full bg-white/20 px-4 py-2 font-medium text-sm text-white backdrop-blur-sm">
												Gérer le profil
											</span>
										</div>
									</Link>
								))}

								{/* Add new artist card */}
								<Link
									href="/dashboard/artist"
									className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-white/20 border-dashed bg-white/5 p-8 text-white/50 transition-all duration-300 hover:border-secondary/50 hover:bg-secondary/5 hover:text-white"
								>
									<Plus className="mb-2 h-10 w-10" />
									<span className="font-medium text-sm">Nouveau projet</span>
								</Link>
							</div>
						) : (
							<div className="rounded-2xl border border-white/20 border-dashed bg-white/5 p-12 text-center">
								<Mic2 className="mx-auto mb-4 h-12 w-12 text-white/30" />
								<p className="mb-4 text-white/50">
									Aucun profil artiste pour le moment
								</p>
								<Button asChild>
									<Link href="/dashboard/artist">
										<Plus className="mr-2 h-4 w-4" /> Créer mon premier projet
									</Link>
								</Button>
							</div>
						)}
					</section>
				)}
			</div>
		</div>
	);
}
