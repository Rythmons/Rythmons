/**
 * Parse and filter CORS origins from environment variable
 * @param corsOriginEnv - Comma-separated string of allowed origins
 * @returns Array of trimmed, non-empty origin strings
 */
export function parseCorsOrigins(corsOriginEnv: string): string[] {
	return corsOriginEnv
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}
