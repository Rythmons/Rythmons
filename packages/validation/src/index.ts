import { z } from "zod";

// Reusable field validators
export const emailSchema = z
	.string()
	.min(1, "L'adresse e-mail est requise")
	.email("Adresse e-mail invalide");

export const passwordSchema = z
	.string()
	.min(8, "Le mot de passe doit contenir au moins 8 caractères")
	.regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
	.regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
	.regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
	.regex(
		/[^A-Za-z0-9]/,
		"Le mot de passe doit contenir au moins un caractère spécial",
	);

export const nameSchema = z
	.string()
	.min(2, "Le nom doit contenir au moins 2 caractères");

/** Normalise un code postal (trim + suppression des espaces) pour accepter la saisie brute. */
export function normalizePostalCode(value: string): string {
	return value.replace(/\s/g, "").trim();
}

// ---- Dates de booking et de calendrier : convention « heure murale » ----
//
// Les dates de booking représentent une heure murale au lieu du concert
// (« le 10 juillet à 20:00 »), pas un instant absolu. Elles sont stockées
// épinglées en UTC : 20:00 saisi = 20:00 stocké en UTC = 20:00 affiché,
// quel que soit le fuseau de l'utilisateur. Cela garantit aussi que le
// regroupement par jour côté serveur (en UTC) correspond toujours au jour
// choisi par l'utilisateur. Toujours formater ces dates avec
// `timeZone: "UTC"`.

/** Heure de concert proposée par défaut (format HH:MM, heure murale). */
export const DEFAULT_BOOKING_TIME = "20:00";

/** Épingle en UTC les composantes locales (année/mois/jour/heure/minute) d'une date. */
export function pinWallClockToUtc(date: Date): Date {
	return new Date(
		Date.UTC(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
		),
	);
}

/** Construit une date épinglée en UTC depuis des champs « YYYY-MM-DD » et « HH:MM ». */
export function wallClockUtcFromInputs(
	dateInput: string,
	timeInput: string,
): Date {
	return new Date(`${dateInput}T${timeInput}:00.000Z`);
}

const optionalUrlSchema = z
	.union([z.string().url("URL invalide"), z.literal("")])
	.optional();

export const venueTypeValues = [
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
] as const;

export const paymentTypeValues = [
	"FIXED_FEE",
	"PERCENTAGE",
	"HAT",
	"NEGOTIABLE",
] as const;

export const MUSIC_GENRES = [
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
] as const;

export const userRoleValues = [
	"ARTIST",
	"ORGANIZER",
	"MEDIA",
	"TECH_SERVICE",
	"BOTH",
] as const;

export const userRoleSchema = z.enum(userRoleValues);

export type UserRole = z.infer<typeof userRoleSchema>;

export const userRoleLabels: Record<UserRole, string> = {
	ARTIST: "Artiste",
	ORGANIZER: "Organisateur / Lieu",
	MEDIA: "Media / Radio",
	TECH_SERVICE: "Prestataire technique",
	BOTH: "Artiste + Organisateur",
};

export const updateUserRoleSchema = z.object({
	role: userRoleSchema.nullable(),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const artistSocialLinksSchema = z.object({
	spotify: optionalUrlSchema,
	youtube: optionalUrlSchema,
	soundcloud: optionalUrlSchema,
	bandcamp: optionalUrlSchema,
	deezer: optionalUrlSchema,
	appleMusic: optionalUrlSchema,
});

export type ArtistSocialLinks = z.infer<typeof artistSocialLinksSchema>;

export const artistSchema = z.object({
	stageName: z
		.string()
		.min(2, "Le nom de scène doit contenir au moins 2 caractères"),
	city: z.string().optional().nullable(),
	postalCode: z
		.string()
		.transform((s) => normalizePostalCode(s))
		.refine(
			(s) => s === "" || /^\d{5}$/.test(s),
			"Code postal invalide (5 chiffres)",
		)
		.optional()
		.nullable()
		.or(z.literal("")),
	photoUrl: z.string().url("URL invalide").optional().nullable(),
	bannerUrl: z.string().url("URL invalide").optional().nullable(),
	bio: z.string().optional().nullable(),
	website: z.string().url("URL invalide").optional().nullable(),
	socialLinks: artistSocialLinksSchema.optional(),
	techRequirements: z.string().optional().nullable(),
	feeMin: z.number().int().nonnegative().optional().nullable(),
	feeMax: z.number().int().nonnegative().optional().nullable(),
	isNegotiable: z.boolean().optional().default(false),
	genreNames: z.array(z.string().min(1)).optional(),
	images: z.array(z.string().url("URL invalide")).optional().default([]),
});

export type ArtistInput = z.infer<typeof artistSchema>;

export const artistSearchSchema = z.object({
	query: z.string().trim().max(100).default(""),
	genreNames: z.array(z.string().min(1)).default([]),
	city: z.string().trim().max(100).default(""),
	postalCode: z.string().trim().max(10).default(""),
	radiusKm: z.number().int().positive().optional().nullable(),
	userLat: z.number().optional().nullable(),
	userLng: z.number().optional().nullable(),
	feeMin: z.number().int().nonnegative().optional().nullable(),
	feeMax: z.number().int().nonnegative().optional().nullable(),
	availabilityDate: z.string().optional().nullable(),
});

export type ArtistSearchInput = z.infer<typeof artistSearchSchema>;

export const venueSchema = z.object({
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	address: z.string().min(5, "L'adresse est requise"),
	city: z.string().min(2, "La ville est requise"),
	postalCode: z
		.string()
		.transform((s) => normalizePostalCode(s))
		.refine((s) => /^\d{5}$/.test(s), "Code postal invalide (5 chiffres)"),
	country: z.string().default("France"),
	venueType: z.enum(venueTypeValues),
	capacity: z.number().int().positive().optional().nullable(),
	description: z.string().optional().nullable(),
	photoUrl: z.string().url("URL invalide").optional().nullable(),
	logoUrl: z.string().url("URL invalide").optional().nullable(),
	paymentPolicy: z.string().optional().nullable(),
	paymentTypes: z.array(z.enum(paymentTypeValues)).optional().default([]),
	budgetMin: z.number().int().nonnegative().optional().nullable(),
	budgetMax: z.number().int().nonnegative().optional().nullable(),
	techInfo: z.string().optional().nullable(),
	genreNames: z.array(z.string().min(1)).optional(),
	images: z.array(z.string().url("URL invalide")).optional().default([]),
});

export type VenueInput = z.infer<typeof venueSchema>;

export const venueSearchSchema = z.object({
	query: z.string().trim().max(100).default(""),
	genreNames: z.array(z.string().min(1)).default([]),
	city: z.string().trim().max(100).default(""),
	postalCode: z.string().trim().max(10).default(""),
	radiusKm: z.number().int().positive().optional().nullable(),
	userLat: z.number().optional().nullable(),
	userLng: z.number().optional().nullable(),
	venueTypes: z.array(z.enum(venueTypeValues)).default([]),
	budgetMin: z.number().int().nonnegative().optional().nullable(),
	budgetMax: z.number().int().nonnegative().optional().nullable(),
	availabilityDate: z.string().optional().nullable(),
});

export type VenueSearchInput = z.infer<typeof venueSearchSchema>;

export const bookingStatusValues = [
	"PENDING",
	"ACCEPTED",
	"REFUSED",
	"CANCELLED",
] as const;

export const bookingStatusSchema = z.enum(bookingStatusValues);

export const bookingByIdSchema = z.object({
	id: z.string().min(1),
});

export const bookingCreateSchema = z.object({
	artistId: z.string().min(1),
	venueId: z.string().min(1),
	proposedDate: z.coerce.date(),
	proposedFee: z.number().int().min(0).nullable().optional(),
	initialMessage: z.string().trim().max(2000).optional(),
});

export const bookingRefuseSchema = bookingByIdSchema.extend({
	reason: z.string().trim().max(500).optional(),
});

export const bookingListFilterSchema = z.object({
	status: bookingStatusSchema.optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingRefuseInput = z.infer<typeof bookingRefuseSchema>;
export type BookingByIdInput = z.infer<typeof bookingByIdSchema>;
export type BookingListFilterInput = z.infer<typeof bookingListFilterSchema>;

// Sign-in validation schema
export const signInSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Le mot de passe est requis"),
});

export type SignInInput = z.infer<typeof signInSchema>;

// Sign-up: account type (Artiste or Organisateur only)
export const signUpRoleValues = ["ARTIST", "ORGANIZER"] as const;
export const signUpRoleSchema = z.enum(signUpRoleValues);
export type SignUpRole = z.infer<typeof signUpRoleSchema>;

export const signUpRoleLabels: Record<SignUpRole, string> = {
	ARTIST: "Artiste",
	ORGANIZER: "Organisateur / Lieu",
};

// Sign-up validation schema
export const signUpBaseSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	password: passwordSchema,
	passwordConfirmation: z.string(),
	role: signUpRoleSchema,
	acceptedTerms: z.boolean(),
});

export const signUpSchema = signUpBaseSchema
	.refine((data) => data.password === data.passwordConfirmation, {
		message: "Les mots de passe ne correspondent pas",
		path: ["passwordConfirmation"],
	})
	.refine((data) => data.acceptedTerms === true, {
		message:
			"Vous devez accepter les conditions g\u00e9n\u00e9rales d'utilisation",
		path: ["acceptedTerms"],
	});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
	email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
