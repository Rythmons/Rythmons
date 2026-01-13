import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	serverExternalPackages: ["@prisma/client", "prisma"],
	transpilePackages: [
		"@rythmons/auth",
		"@rythmons/api",
		"@rythmons/db",
		"@rythmons/validation",
	],
};

export default nextConfig;
