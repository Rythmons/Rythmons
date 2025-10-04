import { expo } from "@better-auth/expo";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../db";

const trustedOriginsFromEnv = (process.env.CORS_ORIGIN || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [...trustedOriginsFromEnv, "mybettertapp://", "exp://"],
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
	plugins: [expo()],
});
