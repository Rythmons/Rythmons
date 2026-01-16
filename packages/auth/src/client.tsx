"use client";

import type { Session } from "@rythmons/auth";
import type {
	ForgotPasswordInput,
	SignInInput,
	SignUpInput,
} from "@rythmons/validation";
import {
	forgotPasswordSchema,
	signInSchema,
	signUpSchema,
} from "@rythmons/validation";
import { useForm } from "@tanstack/react-form";
import type { BetterAuthClientPlugin } from "better-auth/client";
import { createAuthClient } from "better-auth/react";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { ZodSchema } from "zod";

export type AuthClient = ReturnType<typeof createAuthClient>;
export type { Session };

export interface AuthClientConfig {
	baseURL: string;
	fetchOptions?: RequestInit;
	plugins?: BetterAuthClientPlugin[];
}

const AuthContext = createContext<AuthClient | null>(null);

export function createClient(config: AuthClientConfig): AuthClient {
	return createAuthClient(config);
}

export interface AuthProviderProps {
	client: AuthClient;
	children: ReactNode;
}

export function AuthProvider({ client, children }: AuthProviderProps) {
	return <AuthContext.Provider value={client}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthClient {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

export interface AuthActionCallbacks {
	onSuccess?: () => void | Promise<void>;
	onError?: (error: string) => void;
	onFinished?: () => void;
}

interface AuthActionResult {
	success: boolean;
	error?: string;
}

/**
 * Generic hook for handling authentication actions with validation, loading, and error states
 */
function useAuthAction<TInput>(
	_authClient: AuthClient,
	validationSchema: ZodSchema<TInput>,
	action: (
		input: TInput,
		callbacks: {
			onSuccess: () => void | Promise<void>;
			onError: (error: { error?: { message?: string } }) => void;
		},
	) => Promise<void>,
	defaultErrorMessage: string,
) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const execute = async (
		input: TInput,
		callbacks?: AuthActionCallbacks,
	): Promise<AuthActionResult> => {
		setIsLoading(true);
		setError(null);

		// Validate input
		const validation = validationSchema.safeParse(input);
		if (!validation.success) {
			const firstError = validation.error.issues[0];
			const errorMessage = firstError?.message || "Erreur de validation";
			setError(errorMessage);
			callbacks?.onError?.(errorMessage);
			setIsLoading(false);
			callbacks?.onFinished?.();
			return { success: false, error: errorMessage };
		}

		try {
			await action(input, {
				onError: (error) => {
					const errorMessage = error.error?.message || defaultErrorMessage;
					setError(errorMessage);
					callbacks?.onError?.(errorMessage);
				},
				onSuccess: async () => {
					setError(null);
					await callbacks?.onSuccess?.();
				},
			});
			setIsLoading(false);
			callbacks?.onFinished?.();
			return { success: true };
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Une erreur inattendue s'est produite";
			setError(errorMessage);
			callbacks?.onError?.(errorMessage);
			setIsLoading(false);
			callbacks?.onFinished?.();
			return { success: false, error: errorMessage };
		}
	};

	return { execute, isLoading, error };
}

export function useSignIn(authClient: AuthClient) {
	const { execute, isLoading, error } = useAuthAction(
		authClient,
		signInSchema,
		async (input: SignInInput, callbacks) => {
			await authClient.signIn.email(
				{
					email: input.email,
					password: input.password,
				},
				callbacks,
			);
		},
		"Échec de la connexion",
	);

	return { signIn: execute, isLoading, error };
}

export function useSignUp(authClient: AuthClient) {
	const { execute, isLoading, error } = useAuthAction(
		authClient,
		signUpSchema,
		async (input: SignUpInput, callbacks) => {
			await authClient.signUp.email(
				{
					name: input.name,
					email: input.email,
					password: input.password,
				},
				callbacks,
			);
		},
		"Échec de l'inscription",
	);

	return { signUp: execute, isLoading, error };
}

export function useForgotPassword(authClient: AuthClient) {
	const { execute, isLoading, error } = useAuthAction(
		authClient,
		forgotPasswordSchema,
		async (input: ForgotPasswordInput, callbacks) => {
			await authClient.forgetPassword(
				{
					email: input.email,
				},
				callbacks,
			);
		},
		"Échec de la demande de réinitialisation",
	);

	return { forgotPassword: execute, isLoading, error };
}

// ============================================================================
// Shared Form Hooks with Validation
// ============================================================================

/**
 * Shared hook for sign-in form with TanStack Form and Zod validation.
 * This hook provides form state management, validation, and submission logic
 * that can be used in both web and native applications.
 *
 * @param callbacks - Optional callbacks for success, error, and finished states
 * @returns An object containing the form instance and loading state
 *
 * @example
 * ```tsx
 * const { form, isLoading } = useSignInForm({
 *   onSuccess: () => router.push("/dashboard"),
 *   onError: (error) => toast.error(error),
 * });
 *
 * // In your component:
 * <form.Provider>
 *   <form.Field name="email">
 *     {(field) => <input {...field} />}
 *   </form.Field>
 * </form.Provider>
 * ```
 */
export function useSignInForm(callbacks?: AuthActionCallbacks) {
	const authClient = useAuth();
	const { signIn, isLoading } = useSignIn(authClient);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: signInSchema,
		},
		onSubmit: async ({ value }) => {
			await signIn(value, callbacks);
		},
	});

	return { form, isLoading };
}

/**
 * Shared hook for sign-up form with TanStack Form and Zod validation.
 * This hook provides form state management, validation, and submission logic
 * that can be used in both web and native applications.
 *
 * @param callbacks - Optional callbacks for success, error, and finished states
 * @returns An object containing the form instance and loading state
 *
 * @example
 * ```tsx
 * const { form, isLoading } = useSignUpForm({
 *   onSuccess: () => router.push("/dashboard"),
 *   onError: (error) => toast.error(error),
 * });
 *
 * // In your component:
 * <form.Provider>
 *   <form.Field name="name">
 *     {(field) => <input {...field} />}
 *   </form.Field>
 * </form.Provider>
 * ```
 */
export function useSignUpForm(callbacks?: AuthActionCallbacks) {
	const authClient = useAuth();
	const { signUp, isLoading } = useSignUp(authClient);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		validators: {
			onChange: signUpSchema,
		},
		onSubmit: async ({ value }) => {
			await signUp(value, callbacks);
		},
	});

	return { form, isLoading };
}

export function useForgotPasswordForm(callbacks?: AuthActionCallbacks) {
	const authClient = useAuth();
	const { forgotPassword, isLoading } = useForgotPassword(authClient);

	const form = useForm({
		defaultValues: {
			email: "",
		},
		validators: {
			onChange: forgotPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			await forgotPassword(value, callbacks);
		},
	});

	return { form, isLoading };
}
