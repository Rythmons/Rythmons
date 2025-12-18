import "server-only";

import { expo } from "@better-auth/expo";
import { db } from "@rythmons/db";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend";
import { resetPasswordTemplate } from "../server/emails/resetPassword";
import { sendMail, sendMailTest } from "../server/mailer";
import { parseCorsOrigins } from "./utils";

const trustedOriginsFromEnv = parseCorsOrigins(process.env.CORS_ORIGIN || "");

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
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	baseURL: resolvedBaseURL,
	trustedOrigins,
	emailAndPassword: {
		enabled: true,

		sendResetPassword: async ({ user, token }) => {
			const resetUrl = `${process.env.BETTER_AUTH_URL}/reset-password?token=${token}`;

			await sendMailTest({
				to: user.email,
				subject: "Reset your password",
				html: resetPasswordTemplate({
					name: user.name,
					resetUrl,
				}),
			});
		},
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
