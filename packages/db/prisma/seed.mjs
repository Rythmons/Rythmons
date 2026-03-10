import { randomBytes, scryptSync } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Rythmons123!";

const demoUsers = [
	{
		key: "artistOwner",
		id: "seed-user-artist-owner",
		name: "Luna Echo",
		email: "demo.artist@rythmons.local",
		role: "ARTIST",
	},
	{
		key: "organizerOwner",
		id: "seed-user-organizer-owner",
		name: "Le Sonarium",
		email: "demo.organizer@rythmons.local",
		role: "ORGANIZER",
	},
	{
		key: "hybridOwner",
		id: "seed-user-hybrid-owner",
		name: "Maya Pulse",
		email: "demo.both@rythmons.local",
		role: "BOTH",
	},
];

const demoArtists = [
	{
		id: "seed-artist-luna-echo",
		userKey: "artistOwner",
		stageName: "Luna Echo",
		city: "Paris",
		postalCode: "75011",
		bio: "Duo pop-électro pour des shows intimes et des scènes en fin de soirée.",
		website: "https://example.com/luna-echo",
		socialLinks: {
			spotify: "https://open.spotify.com/artist/luna-echo",
			youtube: "https://youtube.com/@lunaecho",
			soundcloud: "https://soundcloud.com/luna-echo",
			bandcamp: "",
			deezer: "",
			appleMusic: "",
		},
		techRequirements:
			"2 micros voix, 2 boîtes DI, sortie stéréo, éclairage de scène chaud.",
		feeMin: 250,
		feeMax: 450,
		isNegotiable: true,
		genreNames: ["Pop", "Electro", "Indie"],
		images: [],
	},
	{
		id: "seed-artist-river-lights",
		userKey: "artistOwner",
		stageName: "River Lights",
		city: "Lyon",
		postalCode: "69001",
		bio: "Trio folk acoustique, idéal pour cafés, lieux culturels et événements en journée.",
		website: "https://example.com/river-lights",
		socialLinks: {
			spotify: "https://open.spotify.com/artist/river-lights",
			youtube: "https://youtube.com/@riverlights",
			soundcloud: "",
			bandcamp: "https://river-lights.bandcamp.com",
			deezer: "",
			appleMusic: "",
		},
		techRequirements: "3 micros voix, 2 tabourets, petite sono si possible.",
		feeMin: 180,
		feeMax: 320,
		isNegotiable: true,
		genreNames: ["Folk", "Acoustique", "Chanson française"],
		images: [],
	},
	{
		id: "seed-artist-maya-pulse",
		userKey: "hybridOwner",
		stageName: "Maya Pulse",
		city: "Marseille",
		postalCode: "13006",
		bio: "Live hybride mélangeant house, voix soul et textures modulaires.",
		website: "https://example.com/maya-pulse",
		socialLinks: {
			spotify: "https://open.spotify.com/artist/maya-pulse",
			youtube: "",
			soundcloud: "https://soundcloud.com/maya-pulse",
			bandcamp: "",
			deezer: "",
			appleMusic: "",
		},
		techRequirements:
			"DI stéréo, table DJ, 2 retours, machine à fumée en option.",
		feeMin: 350,
		feeMax: 650,
		isNegotiable: false,
		genreNames: ["Electro", "Soul", "DJ Set"],
		images: [],
	},
];

const demoVenues = [
	{
		id: "seed-venue-sonarium-club",
		userKey: "organizerOwner",
		name: "Le Sonarium Club",
		address: "12 Rue Oberkampf",
		city: "Paris",
		postalCode: "75011",
		country: "France",
		venueType: "CLUB",
		capacity: 220,
		description:
			"Salle indépendante axée sur les lives en émergence, soirées release et nuits club.",
		paymentPolicy:
			"Balance à partir de 17h00. Repas chaud pour les artistes. Hébergement non inclus.",
		paymentTypes: ["FIXED_FEE", "PERCENTAGE"],
		budgetMin: 250,
		budgetMax: 900,
		techInfo:
			"Système principal, console 24 pistes, fûts de batterie, ampli basse, combo guitare, lumières de scène.",
		genreNames: ["Electro", "Pop", "Indie"],
		images: [],
	},
	{
		id: "seed-venue-cafe-cordes",
		userKey: "organizerOwner",
		name: "Café des Cordes",
		address: "8 Quai de Bondy",
		city: "Lyon",
		postalCode: "69005",
		country: "France",
		venueType: "CAFE",
		capacity: 80,
		description:
			"Café-concert chaleureux avec plateau compact pour acoustique, jazz & chansons.",
		paymentPolicy:
			"Mise en place précoce souhaitée. Boissons incluses. Cachet partagé possible selon billetterie.",
		paymentTypes: ["HAT", "FIXED_FEE", "NEGOTIABLE"],
		budgetMin: 80,
		budgetMax: 300,
		techInfo: "PA compacte, 3 micros, piano droit, éclairage chaud basique.",
		genreNames: ["Jazz", "Folk", "Chanson française", "Acoustique"],
		images: [],
	},
	{
		id: "seed-venue-bleu-nuit",
		userKey: "hybridOwner",
		name: "Bleu Nuit Warehouse",
		address: "24 Rue des Docks",
		city: "Marseille",
		postalCode: "13002",
		country: "France",
		venueType: "CONCERT_HALL",
		capacity: 350,
		description:
			"Espace brut et industriel pour lives club, soirées lancement et shows hybrides.",
		paymentPolicy:
			"Déchargement à partir de 16h00. Traiteur disponible. Nuit sur place sur demande.",
		paymentTypes: ["FIXED_FEE", "NEGOTIABLE"],
		budgetMin: 400,
		budgetMax: 1200,
		techInfo:
			"Grande sono, fond LED, cabine DJ, 4 retours, estrades et backline basique.",
		genreNames: ["Electro", "Hip-Hop", "DJ Set"],
		images: [],
	},
];

function hashPassword(password) {
	const salt = randomBytes(16).toString("hex");
	const key = scryptSync(password.normalize("NFKC"), salt, 64, {
		N: 16_384,
		r: 16,
		p: 1,
		maxmem: 128 * 16_384 * 16 * 2,
	});

	return `${salt}:${key.toString("hex")}`;
}

async function assurerGenres(noms) {
	const genres = await Promise.all(
		noms.map((nom) =>
			prisma.genre.upsert({
				where: { name: nom },
				update: {},
				create: { name: nom },
				select: { id: true },
			}),
		),
	);

	return genres.map(({ id }) => ({ id }));
}

async function upsertUtilisateurAvecCredential(utilisateur) {
	const maintenant = new Date();

	const savedUser = await prisma.user.upsert({
		where: { email: utilisateur.email },
		update: {
			name: utilisateur.name,
			role: utilisateur.role,
			emailVerified: true,
			updatedAt: maintenant,
		},
		create: {
			id: utilisateur.id,
			name: utilisateur.name,
			email: utilisateur.email,
			emailVerified: true,
			role: utilisateur.role,
			createdAt: maintenant,
			updatedAt: maintenant,
		},
	});

	const hashedPassword = hashPassword(DEMO_PASSWORD);
	const compteCredentialExistant = await prisma.account.findFirst({
		where: {
			userId: savedUser.id,
			providerId: "credential",
		},
	});

	if (compteCredentialExistant) {
		await prisma.account.update({
			where: { id: compteCredentialExistant.id },
			data: {
				accountId: savedUser.id,
				password: hashedPassword,
				updatedAt: maintenant,
			},
		});
	} else {
		await prisma.account.create({
			data: {
				id: `${savedUser.id}-credential`,
				accountId: savedUser.id,
				providerId: "credential",
				userId: savedUser.id,
				password: hashedPassword,
				createdAt: maintenant,
				updatedAt: maintenant,
			},
		});
	}

	return savedUser;
}

async function upsertArtiste(artiste, userId) {
	const connectionsGenres = await assurerGenres(artiste.genreNames);

	await prisma.artist.upsert({
		where: { id: artiste.id },
		update: {
			userId,
			stageName: artiste.stageName,
			city: artiste.city,
			postalCode: artiste.postalCode,
			bio: artiste.bio,
			website: artiste.website,
			socialLinks: artiste.socialLinks,
			techRequirements: artiste.techRequirements,
			feeMin: artiste.feeMin,
			feeMax: artiste.feeMax,
			isNegotiable: artiste.isNegotiable,
			images: artiste.images,
			genres: {
				set: connectionsGenres,
			},
		},
		create: {
			id: artiste.id,
			userId,
			stageName: artiste.stageName,
			city: artiste.city,
			postalCode: artiste.postalCode,
			bio: artiste.bio,
			website: artiste.website,
			socialLinks: artiste.socialLinks,
			techRequirements: artiste.techRequirements,
			feeMin: artiste.feeMin,
			feeMax: artiste.feeMax,
			isNegotiable: artiste.isNegotiable,
			images: artiste.images,
			genres: {
				connect: connectionsGenres,
			},
		},
	});
}

async function upsertSalle(salle, ownerId) {
	const connectionsGenres = await assurerGenres(salle.genreNames);

	await prisma.venue.upsert({
		where: { id: salle.id },
		update: {
			ownerId,
			name: salle.name,
			address: salle.address,
			city: salle.city,
			postalCode: salle.postalCode,
			country: salle.country,
			venueType: salle.venueType,
			capacity: salle.capacity,
			description: salle.description,
			paymentPolicy: salle.paymentPolicy,
			paymentTypes: salle.paymentTypes,
			budgetMin: salle.budgetMin,
			budgetMax: salle.budgetMax,
			techInfo: salle.techInfo,
			images: salle.images,
			genres: {
				set: connectionsGenres,
			},
		},
		create: {
			id: salle.id,
			ownerId,
			name: salle.name,
			address: salle.address,
			city: salle.city,
			postalCode: salle.postalCode,
			country: salle.country,
			venueType: salle.venueType,
			capacity: salle.capacity,
			description: salle.description,
			paymentPolicy: salle.paymentPolicy,
			paymentTypes: salle.paymentTypes,
			budgetMin: salle.budgetMin,
			budgetMax: salle.budgetMax,
			techInfo: salle.techInfo,
			images: salle.images,
			genres: {
				connect: connectionsGenres,
			},
		},
	});
}

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL manquant. Chargez apps/web/.env ou apps/web/.env.local avant de lancer le seed.",
		);
	}

	console.info(
		"[seed] Création des utilisateurs, artistes, salles et genres de démo...",
	);

	const usersByKey = new Map();

	for (const user of demoUsers) {
		const savedUser = await upsertUtilisateurAvecCredential(user);
		usersByKey.set(user.key, savedUser);
	}

	for (const artist of demoArtists) {
		const owner = usersByKey.get(artist.userKey);
		if (!owner) {
			throw new Error(
				`Utilisateur de démo manquant pour l'artiste ${artist.stageName}`,
			);
		}

		await upsertArtiste(artist, owner.id);
	}

	for (const venue of demoVenues) {
		const owner = usersByKey.get(venue.userKey);
		if (!owner) {
			throw new Error(
				`Utilisateur de démo manquant pour la salle ${venue.name}`,
			);
		}

		await upsertSalle(venue, owner.id);
	}

	console.info("[seed] Remplissage terminé.");
	console.info("[seed] Identifiants de démo :");
	for (const user of demoUsers) {
		console.info(`- ${user.email} / ${DEMO_PASSWORD} (${user.role})`);
	}
}

main()
	.catch((error) => {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2022"
		) {
			console.error(
				"[seed] Le schéma de base de données est en retard par rapport au schéma Prisma actuel. Lancez `pnpm db:setup` (ou `pnpm db:push` puis `pnpm db:seed`) d'abord.",
			);
		}

		console.error("[seed] Échec :", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
