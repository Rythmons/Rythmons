import { z } from "zod";

// Reusable field validators
export const emailSchema = z
	.string()
	.min(1, "L'adresse e-mail est requise")
	.email("Adresse e-mail invalide");

export const passwordSchema = z
	.string()
	.min(8, "Le mot de passe doit contenir au moins 8 caractères");

export const nameSchema = z
	.string()
	.min(2, "Le nom doit contenir au moins 2 caractères");

// Sign-in validation schema
export const signInSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Le mot de passe est requis"),
});

export type SignInInput = z.infer<typeof signInSchema>;

const ROLES = ["ARTIST", "ORGANIZER", "MEDIA", "TECH_SERVICE"] as const;

// Sign-up validation schema
export const signUpSchema = z
	.object({
		firstName: z.string().min(1, "Le prénom est requis"),
		lastName: z.string().min(1, "Le nom est requis"),
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: z.string().min(1, "La confirmation est requise"),
		role: z.enum(ROLES),
		acceptTerms: z.boolean().refine((val) => val === true, {
			message: "Vous devez accepter les CGU",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Les mots de passe ne correspondent pas",
		path: ["confirmPassword"],
	});

export type SignUpInput = z.infer<typeof signUpSchema>;
