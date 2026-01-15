import { cookies, headers } from "next/headers";

/**
 * Récupère la session depuis un composant serveur.
 * Utilise le proxy local qui gère correctement les cookies sur le même domaine.
 */
export async function getServerSession() {
	const cookieStore = await cookies();
	const allCookies = cookieStore.getAll();

	// Reconstruit l'en-tête cookie à partir de tous les cookies
	const cookieHeader = allCookies
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");

	const isProd = process.env.NODE_ENV === "production";
	if (!isProd) {
		console.log(
			"[getServerSession] Utilisation du proxy local /api/auth/get-session",
		);
		console.log(
			"[getServerSession] cookies:",
			cookieHeader ? "présents" : "absents",
		);
		console.log("[getServerSession] nombre de cookies :", allCookies.length);
	}

	try {
		const headersList = await headers();
		const protocol = headersList.get("x-forwarded-proto") ?? "http";
		const host = headersList.get("host");
		const originFromHeaders = host ? `${protocol}://${host}` : null;
		const baseURL =
			process.env.NEXT_PUBLIC_SERVER_URL ||
			process.env.BETTER_AUTH_URL ||
			originFromHeaders;

		if (!baseURL) {
			console.error(
				"[getServerSession] Impossible de déterminer l'URL de base pour le fetch",
			);
			return { data: null, error: new Error("URL de base manquante") };
		}

		const endpoint = new URL("/api/auth/get-session", baseURL);

		// Utilise le proxy local plutôt qu'un serveur externe pour garder les cookies en first-party
		const response = await fetch(endpoint, {
			method: "GET",
			headers: {
				cookie: cookieHeader,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!isProd) {
			console.log("[getServerSession] statut de la réponse :", response.status);
		}

		if (!response.ok) {
			if (!isProd) {
				console.log("[getServerSession] réponse non OK");
			}
			return { data: null, error: null };
		}

		const sessionData = await response.json();
		if (!isProd) {
			console.log(
				"[getServerSession] session trouvée :",
				sessionData ? "oui" : "non",
			);
		}

		// Better Auth renvoie l'objet session directement (avec user) ou null
		return { data: sessionData, error: null };
	} catch (error) {
		console.error(
			"[getServerSession] Erreur lors de la récupération de la session :",
			error,
		);
		return { data: null, error };
	}
}
