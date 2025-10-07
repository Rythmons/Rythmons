import { expo } from "@better-auth/expo";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../db";

const trustedOriginsFromEnv = (process.env.CORS_ORIGIN || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const googleProviderConfig =
	process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
		? {
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				scope: ["openid", "email", "profile"],
				accessType: "offline" as const,
				prompt: "select_account consent" as const,
			}
		: undefined;

const resolvedBaseURL =
	process.env.BETTER_AUTH_URL ||
	process.env.NEXT_PUBLIC_APP_URL ||
	(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const trustedOrigins = [...trustedOriginsFromEnv, "mybettertapp://", "exp://"];

if (resolvedBaseURL) {
	try {
		const baseOrigin = new URL(resolvedBaseURL).origin;
		if (!trustedOrigins.includes(baseOrigin)) {
			trustedOrigins.push(baseOrigin);
		}
	} catch (error) {
		console.warn("Invalid BETTER_AUTH_URL provided:", resolvedBaseURL, error);
	}
}

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: resolvedBaseURL,
	trustedOrigins,
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "lax", // First-party cookies for same-domain setup
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		},
	},
	socialProviders: {
		...(googleProviderConfig ? { google: googleProviderConfig } : {}),
	},
	plugins: [expo()],
});
