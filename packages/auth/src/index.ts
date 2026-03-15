export { getDevVerificationPreview } from "./dev-email-preview";
export type { Session } from "./types";
export type * from "./utils";

import "server-only";

import { expo } from "@better-auth/expo";
import { db } from "@rythmons/db";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { saveDevVerificationPreview } from "./dev-email-preview";
import { sendMail } from "./email/mailer";
import { resetPasswordTemplate, verifyEmailTemplate } from "./email/templates";
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

const vercelDeploymentUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: undefined;

const isVercelPreview =
	process.env.VERCEL_ENV === "preview" ||
	(process.env.VERCEL && process.env.NODE_ENV !== "production");

const resolvedBaseURL = isVercelPreview
	? vercelDeploymentUrl ||
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.BETTER_AUTH_URL
	: process.env.BETTER_AUTH_URL ||
		process.env.NEXT_PUBLIC_APP_URL ||
		vercelDeploymentUrl;

const trustedOrigins = [...trustedOriginsFromEnv, "rythmons://", "exp://"];

const originCandidates = [
	resolvedBaseURL,
	process.env.BETTER_AUTH_URL,
	process.env.NEXT_PUBLIC_APP_URL,
	vercelDeploymentUrl,
].filter(Boolean) as string[];

for (const candidate of originCandidates) {
	try {
		const origin = new URL(candidate).origin;
		if (!trustedOrigins.includes(origin)) {
			trustedOrigins.push(origin);
		}
	} catch (error) {
		console.warn("Invalid origin provided:", candidate, error);
	}
}

function getRequestOrigin(request?: Request) {
	if (!request) return null;
	const originHeader = request.headers.get("origin");
	if (originHeader) {
		try {
			return new URL(originHeader).origin;
		} catch {
			// ignore
		}
	}

	const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
	const forwardedHost =
		request.headers.get("x-forwarded-host") || request.headers.get("host");
	if (forwardedHost) {
		return `${forwardedProto}://${forwardedHost}`;
	}

	return null;
}

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	baseURL: resolvedBaseURL,
	trustedOrigins: async (request) => {
		const dynamicOrigins = [...trustedOrigins];
		const requestOrigin = getRequestOrigin(request);
		if (!requestOrigin) return dynamicOrigins;

		try {
			const { hostname } = new URL(requestOrigin);
			const isVercelPreviewHost = hostname.endsWith(".vercel.app");
			const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
			if (
				(isVercelPreviewHost || isLocalhost) &&
				!dynamicOrigins.includes(requestOrigin)
			) {
				dynamicOrigins.push(requestOrigin);
			}
		} catch {
			// ignore
		}

		return dynamicOrigins;
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }, _request) => {
			saveDevVerificationPreview(user.email, url);

			try {
				await sendMail({
					to: user.email,
					subject: "Vérifiez votre adresse e-mail - Rythmons",
					html: verifyEmailTemplate({
						name: user.name ?? undefined,
						verifyUrl: url,
					}),
				});
			} catch (error) {
				console.error("[auth] Failed to send verification email", error);
				if (process.env.VERCEL_ENV !== "production") {
					console.info(
						`[auth] Dev verification link for ${user.email}: ${url}`,
					);
					return;
				}

				throw error;
			}
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,

		sendResetPassword: async ({
			user,
			token,
		}: {
			user: { email: string; name?: string | null };
			token: string;
		}) => {
			const baseUrl =
				resolvedBaseURL ||
				process.env.BETTER_AUTH_URL ||
				process.env.NEXT_PUBLIC_APP_URL;

			if (!baseUrl) {
				throw new Error("Missing base URL for reset password link");
			}

			const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

			try {
				await sendMail({
					to: user.email,
					subject: "Réinitialisez votre mot de passe",
					html: resetPasswordTemplate({
						name: user.name ?? undefined,
						resetUrl,
					}),
				});
			} catch (error) {
				console.error("[auth] Failed to send reset-password email", error);
				if (process.env.VERCEL_ENV !== "production") {
					throw error;
				}
			}
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
