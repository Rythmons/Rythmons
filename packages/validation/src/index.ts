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
	password: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;

// Sign-up validation schema
export const signUpSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
	email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
