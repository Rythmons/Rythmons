import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "../../packages/db/prisma/schema.prisma",
	migrations: {
		path: "../../packages/db/prisma/migrations",
		seed: "node ../../packages/db/prisma/seed.mjs",
	},
});
