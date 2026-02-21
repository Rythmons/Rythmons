import type { NextConfig } from "next";

// Security headers to protect against common vulnerabilities
const securityHeaders = [
	{
		key: "X-DNS-Prefetch-Control",
		value: "on",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{
		key: "X-Frame-Options",
		value: "SAMEORIGIN",
	},
	{
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		key: "X-XSS-Protection",
		value: "1; mode=block",
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin",
	},
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
	},
	{
		key: "Cross-Origin-Opener-Policy",
		value: "same-origin",
	},
	{
		key: "Cross-Origin-Resource-Policy",
		value: "same-origin",
	},
	{
		key: "Cross-Origin-Embedder-Policy",
		value: "credentialless",
	},
];

const nextConfig: NextConfig = {
	typedRoutes: true,
	serverExternalPackages: ["@prisma/client", "prisma"],
	transpilePackages: [
		"@rythmons/auth",
		"@rythmons/api",
		"@rythmons/db",
		"@rythmons/validation",
	],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "utfs.io",
			},
		],
	},
	async headers() {
		return [
			{
				// Apply security headers to all routes
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
// Force restart for Prisma Client update
