import { auth, type Session } from "@rythmons/auth";
import { cookies, headers } from "next/headers";

type ServerSessionResult = {
	data: Session | null;
	error: unknown | null;
};

/**
 * Récupère la session depuis un composant serveur.
 * Interroge Better Auth directement avec les en-têtes de la requête courante.
 */
export async function getServerSession(): Promise<ServerSessionResult> {
	const cookieStore = await cookies();
	const allCookies = cookieStore.getAll();

	// Reconstruit l'en-tête cookie à partir de tous les cookies
	const cookieHeader = allCookies
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");

	const isProd = process.env.NODE_ENV === "production";
	if (!isProd) {
		console.log(
			"[getServerSession] Utilisation directe de auth.api.getSession",
		);
		console.log(
			"[getServerSession] cookies:",
			cookieHeader ? "présents" : "absents",
		);
		console.log("[getServerSession] nombre de cookies :", allCookies.length);
	}

	try {
		const headersList = await headers();
		const requestHeaders = new Headers(headersList);

		// En environnement serveur, on force le header cookie s'il n'est pas déjà propagé.
		if (cookieHeader && !requestHeaders.get("cookie")) {
			requestHeaders.set("cookie", cookieHeader);
		}

		const sessionData = (await auth.api.getSession({
			headers: requestHeaders,
		})) as Session | null;

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
