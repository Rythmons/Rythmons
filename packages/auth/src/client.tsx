"use client";

import type { SignInInput, SignUpInput } from "@rythmons/validation";
import { signInSchema, signUpSchema } from "@rythmons/validation";
import type { BetterAuthClientPlugin } from "better-auth/client";
import { createAuthClient } from "better-auth/react";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { ZodSchema } from "zod";
import type { Session } from "./types";

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
	authClient: AuthClient,
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
			const errorMessage = firstError?.message || "Validation error";
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
				err instanceof Error ? err.message : "An unexpected error occurred";
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
		"Failed to sign in",
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
		"Failed to sign up",
	);

	return { signUp: execute, isLoading, error };
}
