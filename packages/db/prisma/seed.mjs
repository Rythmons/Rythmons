import { randomBytes, scryptSync } from "node:crypto";

import { fakerFR as faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Rythmons123!";
const GENERATED_NAMESPACE = "seed-generated";
const DEFAULT_FAKE_SEED = 20260311;
const DEFAULT_ARTIST_COUNT = 24;
const DEFAULT_ORGANIZER_COUNT = 12;
const DEFAULT_VENUE_COUNT = 18;

const CITY_FIXTURES = [
	{
		city: "Paris",
		postalCodes: ["75011", "75018", "75020"],
		lat: 48.8566,
		lng: 2.3522,
	},
	{
		city: "Lyon",
		postalCodes: ["69001", "69003", "69007"],
		lat: 45.764,
		lng: 4.8357,
	},
	{
		city: "Marseille",
		postalCodes: ["13002", "13005", "13006"],
		lat: 43.2965,
		lng: 5.3698,
	},
	{
		city: "Bordeaux",
		postalCodes: ["33000", "33100", "33800"],
		lat: 44.8378,
		lng: -0.5792,
	},
	{
		city: "Lille",
		postalCodes: ["59000", "59800", "59260"],
		lat: 50.6292,
		lng: 3.0573,
	},
	{
		city: "Nantes",
		postalCodes: ["44000", "44100", "44200"],
		lat: 47.2184,
		lng: -1.5536,
	},
	{
		city: "Toulouse",
		postalCodes: ["31000", "31200", "31400"],
		lat: 43.6047,
		lng: 1.4442,
	},
	{
		city: "Montpellier",
		postalCodes: ["34000", "34070", "34090"],
		lat: 43.6108,
		lng: 3.8767,
	},
	{
		city: "Rennes",
		postalCodes: ["35000", "35700", "35200"],
		lat: 48.1173,
		lng: -1.6778,
	},
	{
		city: "Strasbourg",
		postalCodes: ["67000", "67100", "67200"],
		lat: 48.5734,
		lng: 7.7521,
	},
];

const GENRE_FIXTURES = [
	"Pop",
	"Rock",
	"Folk",
	"Jazz",
	"Blues",
	"Electro",
	"Hip-Hop",
	"R&B",
	"Soul",
	"Funk",
	"Reggae",
	"Metal",
	"Punk",
	"Indie",
	"Classique",
	"World Music",
	"Chanson française",
	"Variété",
	"Acoustique",
	"DJ Set",
];

const VENUE_TYPE_FIXTURES = [
	"BAR",
	"CLUB",
	"CONCERT_HALL",
	"FESTIVAL",
	"CAFE",
	"RESTAURANT",
	"CULTURAL_CENTER",
	"THEATER",
	"OPEN_AIR",
	"OTHER",
];

const PAYMENT_TYPE_FIXTURES = ["FIXED_FEE", "PERCENTAGE", "HAT", "NEGOTIABLE"];

const ARTIST_STYLE_FIXTURES = [
	"set organique et frontal",
	"live nocturne tres danse",
	"concert intimiste et chaleureux",
	"show hybride entre machines et instruments",
	"format festival tres efficace",
	"proposition elegante pour lieux culturels",
];

const VENUE_STYLE_FIXTURES = [
	"programmation exigeante axee decouverte",
	"lieu vivant pour releases, showcases et formats hybrides",
	"espace chaleureux parfait pour concerts assis-debout",
	"adresse reperee pour scenes locales et tournees emergentes",
	"configuration adaptable pour soirees club et concerts",
];

const MEDIA_PALETTES = {
	artist: ["241137", "4c1d95", "be185d"],
	venue: ["0f172a", "164e63", "0f766e"],
	banner: ["1e1b4b", "581c87", "9d174d"],
};

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
		latitude: 48.8632,
		longitude: 2.3701,
		photoUrl: creerPlaceholderMediaUrl({
			type: "artist",
			slug: "luna-echo",
			label: "Luna Echo Portrait",
			width: 900,
			height: 900,
		}),
		bannerUrl: creerPlaceholderMediaUrl({
			type: "banner",
			slug: "luna-echo",
			label: "Luna Echo Banner",
			width: 1600,
			height: 520,
		}),
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
		images: creerGalerieMedia({
			type: "artist",
			slug: "luna-echo",
			baseLabel: "Luna Echo Live",
			count: 4,
		}),
	},
	{
		id: "seed-artist-river-lights",
		userKey: "artistOwner",
		stageName: "River Lights",
		city: "Lyon",
		postalCode: "69001",
		latitude: 45.764,
		longitude: 4.8357,
		photoUrl: creerPlaceholderMediaUrl({
			type: "artist",
			slug: "river-lights",
			label: "River Lights Portrait",
			width: 900,
			height: 900,
		}),
		bannerUrl: creerPlaceholderMediaUrl({
			type: "banner",
			slug: "river-lights",
			label: "River Lights Banner",
			width: 1600,
			height: 520,
		}),
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
		images: creerGalerieMedia({
			type: "artist",
			slug: "river-lights",
			baseLabel: "River Lights Session",
			count: 4,
		}),
	},
	{
		id: "seed-artist-maya-pulse",
		userKey: "hybridOwner",
		stageName: "Maya Pulse",
		city: "Marseille",
		postalCode: "13006",
		latitude: 43.2926,
		longitude: 5.3825,
		photoUrl: creerPlaceholderMediaUrl({
			type: "artist",
			slug: "maya-pulse",
			label: "Maya Pulse Portrait",
			width: 900,
			height: 900,
		}),
		bannerUrl: creerPlaceholderMediaUrl({
			type: "banner",
			slug: "maya-pulse",
			label: "Maya Pulse Banner",
			width: 1600,
			height: 520,
		}),
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
		images: creerGalerieMedia({
			type: "artist",
			slug: "maya-pulse",
			baseLabel: "Maya Pulse Stage",
			count: 4,
		}),
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
		latitude: 48.8632,
		longitude: 2.3701,
		country: "France",
		venueType: "CLUB",
		capacity: 220,
		photoUrl: creerPlaceholderMediaUrl({
			type: "venue",
			slug: "sonarium-club",
			label: "Le Sonarium Club",
			width: 1600,
			height: 900,
		}),
		logoUrl: creerAvatarUrl("shapes", "sonarium-club-logo"),
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
		images: creerGalerieMedia({
			type: "venue",
			slug: "sonarium-club",
			baseLabel: "Sonarium Club",
			count: 4,
		}),
	},
	{
		id: "seed-venue-cafe-cordes",
		userKey: "organizerOwner",
		name: "Café des Cordes",
		address: "8 Quai de Bondy",
		city: "Lyon",
		postalCode: "69005",
		latitude: 45.7577,
		longitude: 4.8274,
		country: "France",
		venueType: "CAFE",
		capacity: 80,
		photoUrl: creerPlaceholderMediaUrl({
			type: "venue",
			slug: "cafe-des-cordes",
			label: "Cafe des Cordes",
			width: 1600,
			height: 900,
		}),
		logoUrl: creerAvatarUrl("shapes", "cafe-des-cordes-logo"),
		description:
			"Café-concert chaleureux avec plateau compact pour acoustique, jazz & chansons.",
		paymentPolicy:
			"Mise en place précoce souhaitée. Boissons incluses. Cachet partagé possible selon billetterie.",
		paymentTypes: ["HAT", "FIXED_FEE", "NEGOTIABLE"],
		budgetMin: 80,
		budgetMax: 300,
		techInfo: "PA compacte, 3 micros, piano droit, éclairage chaud basique.",
		genreNames: ["Jazz", "Folk", "Chanson française", "Acoustique"],
		images: creerGalerieMedia({
			type: "venue",
			slug: "cafe-des-cordes",
			baseLabel: "Cafe des Cordes",
			count: 4,
		}),
	},
	{
		id: "seed-venue-bleu-nuit",
		userKey: "hybridOwner",
		name: "Bleu Nuit Warehouse",
		address: "24 Rue des Docks",
		city: "Marseille",
		postalCode: "13002",
		latitude: 43.3044,
		longitude: 5.3736,
		country: "France",
		venueType: "CONCERT_HALL",
		capacity: 350,
		photoUrl: creerPlaceholderMediaUrl({
			type: "venue",
			slug: "bleu-nuit-warehouse",
			label: "Bleu Nuit Warehouse",
			width: 1600,
			height: 900,
		}),
		logoUrl: creerAvatarUrl("shapes", "bleu-nuit-warehouse-logo"),
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
		images: creerGalerieMedia({
			type: "venue",
			slug: "bleu-nuit-warehouse",
			baseLabel: "Bleu Nuit Warehouse",
			count: 4,
		}),
	},
];

function lireEntierDepuisEnv(nomVariable, valeurParDefaut) {
	const valeur = process.env[nomVariable];
	if (!valeur) {
		return valeurParDefaut;
	}

	const entier = Number.parseInt(valeur, 10);
	if (!Number.isFinite(entier) || entier < 0) {
		throw new Error(`${nomVariable} doit etre un entier positif ou nul.`);
	}

	return entier;
}

function creerSlug(valeur) {
	return valeur
		.normalize("NFD")
		.replace(/[^\w\s-]/g, "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-");
}

function creerAvatarUrl(type, seed) {
	return `https://api.dicebear.com/9.x/${type}/svg?seed=${encodeURIComponent(seed)}`;
}

function creerPlaceholderMediaUrl({ type, slug, label, width, height }) {
	const palette = MEDIA_PALETTES[type] ?? MEDIA_PALETTES.artist;
	const background = palette[0];
	const foreground = "f8fafc";
	return `https://placehold.co/${width}x${height}/${background}/${foreground}.png?text=${encodeURIComponent(label)}&font=montserrat&seed=${encodeURIComponent(`${type}-${slug}`)}`;
}

function creerGalerieMedia({ type, slug, baseLabel, count }) {
	return Array.from({ length: count }, (_, index) =>
		creerPlaceholderMediaUrl({
			type,
			slug: `${slug}-${index + 1}`,
			label: `${baseLabel} ${String(index + 1).padStart(2, "0")}`,
			width: 1400,
			height: 1000,
		}),
	);
}

function choisirVille() {
	const selection = faker.helpers.arrayElement(CITY_FIXTURES);
	const offset = () =>
		faker.number.float({ min: -0.04, max: 0.04, fractionDigits: 4 });
	return {
		city: selection.city,
		postalCode: faker.helpers.arrayElement(selection.postalCodes),
		lat: selection.lat + offset(),
		lng: selection.lng + offset(),
	};
}

function choisirGenres(minimum = 2, maximum = 4) {
	const taille = faker.number.int({ min: minimum, max: maximum });
	return faker.helpers.arrayElements(GENRE_FIXTURES, taille);
}

function choisirPaiements() {
	return faker.helpers.arrayElements(
		PAYMENT_TYPE_FIXTURES,
		faker.number.int({ min: 1, max: 3 }),
	);
}

function creerLiensSociaux(slug) {
	return {
		spotify: `https://open.spotify.com/artist/${slug}`,
		youtube: `https://youtube.com/@${slug}`,
		soundcloud: `https://soundcloud.com/${slug}`,
		bandcamp: `https://${slug}.bandcamp.com`,
		deezer: "",
		appleMusic: "",
	};
}

function creerArtistesGeneres(nombre) {
	return Array.from({ length: nombre }, (_, index) => {
		const numero = String(index + 1).padStart(3, "0");
		const ownerKey = `generated-artist-owner-${numero}`;
		const ownerName = faker.person.fullName();
		const stageName = faker.helpers.arrayElement([
			`${faker.word.adjective()} ${faker.word.noun()}`,
			`${faker.person.firstName()} ${faker.word.noun()}`,
			`${faker.word.adjective()} ${faker.person.firstName()}`,
		]);
		const slug = creerSlug(stageName);
		const localisation = choisirVille();
		const genreNames = choisirGenres();
		const feeMin = faker.number.int({ min: 120, max: 600 });
		const feeMax = feeMin + faker.number.int({ min: 80, max: 500 });

		return {
			user: {
				key: ownerKey,
				id: `${GENERATED_NAMESPACE}-user-artist-${numero}`,
				name: ownerName,
				email: `seed.artist.${numero}@rythmons.local`,
				role: "ARTIST",
			},
			artist: {
				id: `${GENERATED_NAMESPACE}-artist-${numero}`,
				userKey: ownerKey,
				stageName,
				city: localisation.city,
				postalCode: localisation.postalCode,
				latitude: localisation.lat,
				longitude: localisation.lng,
				photoUrl: creerPlaceholderMediaUrl({
					type: "artist",
					slug: `${slug}-portrait`,
					label: `${stageName} Portrait`,
					width: 900,
					height: 900,
				}),
				bannerUrl: creerPlaceholderMediaUrl({
					type: "banner",
					slug: `${slug}-banner`,
					label: `${stageName} Banner`,
					width: 1600,
					height: 520,
				}),
				bio: `${stageName} propose un ${faker.helpers.arrayElement(ARTIST_STYLE_FIXTURES)}, ancre a ${localisation.city} avec une couleur ${genreNames.join(", ").toLowerCase()}.`,
				website: `https://${slug}.demo.rythmons.local`,
				socialLinks: creerLiensSociaux(slug),
				techRequirements: faker.helpers.arrayElement([
					"2 retours, 2 micros voix et une DI stereo.",
					"Patch simple, lumiere chaude et balance de 30 minutes.",
					"Batterie sur place ideale, 3 micros et console numerique.",
					"Table DJ, 2 retours, fumee legere si possible.",
				]),
				feeMin,
				feeMax,
				isNegotiable: faker.datatype.boolean(0.65),
				genreNames,
				images: creerGalerieMedia({
					type: "artist",
					slug,
					baseLabel: `${stageName} Live`,
					count: 4,
				}),
			},
		};
	});
}

function creerOrganisateursGeneres(nombre) {
	return Array.from({ length: nombre }, (_, index) => {
		const numero = String(index + 1).padStart(3, "0");
		return {
			key: `generated-organizer-owner-${numero}`,
			id: `${GENERATED_NAMESPACE}-user-organizer-${numero}`,
			name: faker.company.name(),
			email: `seed.organizer.${numero}@rythmons.local`,
			role: "ORGANIZER",
		};
	});
}

function creerSallesGenerees(nombre, organisateurs) {
	return Array.from({ length: nombre }, (_, index) => {
		const numero = String(index + 1).padStart(3, "0");
		const proprietaire = organisateurs[index % organisateurs.length];
		const localisation = choisirVille();
		const genreNames = choisirGenres();
		const venueType = faker.helpers.arrayElement(VENUE_TYPE_FIXTURES);
		const prefixeNom = faker.helpers.arrayElement([
			"Le",
			"La",
			"Les",
			"Atelier",
			"Maison",
			"Station",
		]);
		const suffixeNom = faker.helpers.arrayElement([
			"Parallele",
			"Velvet",
			"Nova",
			"Cordes",
			"Panorama",
			"Transit",
			"Mirage",
			"Canal",
		]);
		const nom = `${prefixeNom} ${suffixeNom}`;
		const slug = creerSlug(nom);
		const budgetMin = faker.number.int({ min: 80, max: 600 });
		const budgetMax = budgetMin + faker.number.int({ min: 120, max: 1200 });

		return {
			id: `${GENERATED_NAMESPACE}-venue-${numero}`,
			userKey: proprietaire.key,
			name: nom,
			address: faker.location.streetAddress(),
			city: localisation.city,
			postalCode: localisation.postalCode,
			latitude: localisation.lat,
			longitude: localisation.lng,
			country: "France",
			venueType,
			capacity: faker.number.int({ min: 50, max: 900 }),
			description: `${nom} est un ${faker.helpers.arrayElement(VENUE_STYLE_FIXTURES)} a ${localisation.city}, avec une affinite pour ${genreNames.slice(0, 2).join(" et ").toLowerCase()}.`,
			photoUrl: creerPlaceholderMediaUrl({
				type: "venue",
				slug: `${slug}-cover`,
				label: nom,
				width: 1600,
				height: 900,
			}),
			logoUrl: creerAvatarUrl("shapes", slug),
			paymentPolicy: faker.helpers.arrayElement([
				"Balance en fin d'apres-midi, catering leger et equipe d'accueil sur place.",
				"Montage fluide, accompagnement billetterie et communication locale possible.",
				"Repas inclus, horaires souples et conditions a adapter selon le projet.",
			]),
			paymentTypes: choisirPaiements(),
			budgetMin,
			budgetMax,
			techInfo: faker.helpers.arrayElement([
				"Console numerique, systeme facade, 3 retours et backline leger.",
				"PA sur place, lumiere frontale, micros et patch standard disponibles.",
				"Configuration club avec cabine DJ, diffusion principale et technicien selon date.",
			]),
			genreNames,
			images: creerGalerieMedia({
				type: "venue",
				slug,
				baseLabel: `${nom} Gallery`,
				count: 4,
			}),
		};
	});
}

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
			latitude: artiste.latitude ?? null,
			longitude: artiste.longitude ?? null,
			photoUrl: artiste.photoUrl ?? null,
			bannerUrl: artiste.bannerUrl ?? null,
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
			latitude: artiste.latitude ?? null,
			longitude: artiste.longitude ?? null,
			photoUrl: artiste.photoUrl ?? null,
			bannerUrl: artiste.bannerUrl ?? null,
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
			latitude: salle.latitude ?? null,
			longitude: salle.longitude ?? null,
			country: salle.country,
			venueType: salle.venueType,
			capacity: salle.capacity,
			description: salle.description,
			photoUrl: salle.photoUrl ?? null,
			logoUrl: salle.logoUrl ?? null,
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
			latitude: salle.latitude ?? null,
			longitude: salle.longitude ?? null,
			country: salle.country,
			venueType: salle.venueType,
			capacity: salle.capacity,
			description: salle.description,
			photoUrl: salle.photoUrl ?? null,
			logoUrl: salle.logoUrl ?? null,
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

async function supprimerDonneesGenerees() {
	await prisma.artist.deleteMany({
		where: {
			id: {
				startsWith: `${GENERATED_NAMESPACE}-artist-`,
			},
		},
	});

	await prisma.venue.deleteMany({
		where: {
			id: {
				startsWith: `${GENERATED_NAMESPACE}-venue-`,
			},
		},
	});

	await prisma.account.deleteMany({
		where: {
			userId: {
				startsWith: `${GENERATED_NAMESPACE}-user-`,
			},
		},
	});

	await prisma.user.deleteMany({
		where: {
			id: {
				startsWith: `${GENERATED_NAMESPACE}-user-`,
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

	faker.seed(lireEntierDepuisEnv("SEED_FAKE_SEED", DEFAULT_FAKE_SEED));

	const generatedArtistCount = lireEntierDepuisEnv(
		"SEED_ARTIST_COUNT",
		DEFAULT_ARTIST_COUNT,
	);
	const generatedOrganizerCount = Math.max(
		1,
		lireEntierDepuisEnv("SEED_ORGANIZER_COUNT", DEFAULT_ORGANIZER_COUNT),
	);
	const generatedVenueCount = lireEntierDepuisEnv(
		"SEED_VENUE_COUNT",
		DEFAULT_VENUE_COUNT,
	);
	const generatedArtists = creerArtistesGeneres(generatedArtistCount);
	const generatedOrganizers = creerOrganisateursGeneres(
		generatedOrganizerCount,
	);
	const generatedVenues = creerSallesGenerees(
		generatedVenueCount,
		generatedOrganizers,
	);

	console.info(
		"[seed] Création des utilisateurs, artistes, salles et genres de démo...",
	);

	const usersByKey = new Map();

	for (const user of demoUsers) {
		const savedUser = await upsertUtilisateurAvecCredential(user);
		usersByKey.set(user.key, savedUser);
	}

	await supprimerDonneesGenerees();

	for (const generatedArtist of generatedArtists) {
		const savedUser = await upsertUtilisateurAvecCredential(
			generatedArtist.user,
		);
		usersByKey.set(generatedArtist.user.key, savedUser);
	}

	for (const generatedOrganizer of generatedOrganizers) {
		const savedUser = await upsertUtilisateurAvecCredential(generatedOrganizer);
		usersByKey.set(generatedOrganizer.key, savedUser);
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

	for (const generatedArtist of generatedArtists) {
		const owner = usersByKey.get(generatedArtist.artist.userKey);
		if (!owner) {
			throw new Error(
				`Utilisateur genere manquant pour l'artiste ${generatedArtist.artist.stageName}`,
			);
		}

		await upsertArtiste(generatedArtist.artist, owner.id);
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

	for (const generatedVenue of generatedVenues) {
		const owner = usersByKey.get(generatedVenue.userKey);
		if (!owner) {
			throw new Error(
				`Utilisateur genere manquant pour la salle ${generatedVenue.name}`,
			);
		}

		await upsertSalle(generatedVenue, owner.id);
	}

	console.info("[seed] Remplissage terminé.");
	console.info(
		`[seed] Jeu genere: ${generatedArtistCount} artiste(s), ${generatedOrganizerCount} organisateur(s), ${generatedVenueCount} lieu(x).`,
	);
	console.info("[seed] Identifiants de démo :");
	for (const user of demoUsers) {
		console.info(`- ${user.email} / ${DEMO_PASSWORD} (${user.role})`);
	}
	console.info(
		"[seed] Pour changer le volume: SEED_ARTIST_COUNT, SEED_ORGANIZER_COUNT, SEED_VENUE_COUNT, SEED_FAKE_SEED.",
	);
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
