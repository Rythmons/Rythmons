import { db, type VenueType } from "@rythmons/db";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Venue type values for validation
const venueTypeValues = [
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

// Predefined music genres
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

// Schema for creating/updating a venue
const venueSchema = z.object({
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	address: z.string().min(5, "L'adresse est requise"),
	city: z.string().min(2, "La ville est requise"),
	postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
	country: z.string().default("France"),
	venueType: z.enum(venueTypeValues),
	capacity: z.number().int().positive().optional().nullable(),
	description: z.string().optional().nullable(),
	photoUrl: z.string().url().optional().nullable(),
	logoUrl: z.string().url().optional().nullable(),
	genreNames: z.array(z.string()).optional(),
});

export const venueRouter = router({
	// Get the current user's venue (if any)
	getMyVenue: protectedProcedure.query(async ({ ctx }) => {
		const venue = await db.venue.findFirst({
			where: {
				ownerId: ctx.session.user.id,
			},
			include: {
				genres: true,
			},
		});
		return venue;
	}),

	// Get a venue by ID (public)
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const venue = await db.venue.findUnique({
				where: { id: input.id },
				include: {
					genres: true,
					owner: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});
			return venue;
		}),

	// Get all available genres
	getAllGenres: publicProcedure.query(() => {
		return MUSIC_GENRES;
	}),

	// Create a new venue
	create: protectedProcedure
		.input(venueSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user already has a venue
			const existingVenue = await db.venue.findFirst({
				where: { ownerId: ctx.session.user.id },
			});

			if (existingVenue) {
				throw new Error("Vous avez déjà un lieu enregistré");
			}

			const { genreNames, ...venueData } = input;

			// Create or connect genres
			const genreConnections =
				genreNames && genreNames.length > 0
					? await Promise.all(
							genreNames.map(async (name) => {
								const genre = await db.genre.upsert({
									where: { name },
									update: {},
									create: { name },
								});
								return { id: genre.id };
							}),
						)
					: [];

			const venue = await db.venue.create({
				data: {
					...venueData,
					venueType: venueData.venueType as VenueType,
					ownerId: ctx.session.user.id,
					genres: {
						connect: genreConnections,
					},
				},
				include: {
					genres: true,
				},
			});

			return venue;
		}),

	// Update an existing venue
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: venueSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const venue = await db.venue.findUnique({
				where: { id: input.id },
			});

			if (!venue) {
				throw new Error("Lieu non trouvé");
			}

			if (venue.ownerId !== ctx.session.user.id) {
				throw new Error("Vous n'êtes pas autorisé à modifier ce lieu");
			}

			const { genreNames, ...venueData } = input.data;

			// Handle genres update if provided
			let genresUpdate = {};
			if (genreNames !== undefined) {
				const genreConnections =
					genreNames.length > 0
						? await Promise.all(
								genreNames.map(async (name) => {
									const genre = await db.genre.upsert({
										where: { name },
										update: {},
										create: { name },
									});
									return { id: genre.id };
								}),
							)
						: [];

				genresUpdate = {
					genres: {
						set: genreConnections,
					},
				};
			}

			const updatedVenue = await db.venue.update({
				where: { id: input.id },
				data: {
					...venueData,
					venueType: venueData.venueType as VenueType | undefined,
					...genresUpdate,
				},
				include: {
					genres: true,
				},
			});

			return updatedVenue;
		}),

	// Delete a venue
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const venue = await db.venue.findUnique({
				where: { id: input.id },
			});

			if (!venue) {
				throw new Error("Lieu non trouvé");
			}

			if (venue.ownerId !== ctx.session.user.id) {
				throw new Error("Vous n'êtes pas autorisé à supprimer ce lieu");
			}

			await db.venue.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
