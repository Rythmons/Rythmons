import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
