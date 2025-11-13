"use client";

import type { BetterAuthClientPlugin } from "better-auth/client";
import { createAuthClient } from "better-auth/react";
import { createContext, type ReactNode, useContext } from "react";

export type AuthClient = ReturnType<typeof createAuthClient>;

export type Session = {
	user: {
		id: string;
		name: string;
		email: string;
		emailVerified: boolean;
		image?: string | null;
		createdAt: Date;
		updatedAt: Date;
	};
	session: {
		id: string;
		expiresAt: Date;
		token: string;
		createdAt: Date;
		updatedAt: Date;
		ipAddress?: string | null;
		userAgent?: string | null;
		userId: string;
	};
};

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
