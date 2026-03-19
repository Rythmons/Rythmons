/**
 * Geocoding utility using the French government address API (api-adresse.data.gouv.fr).
 * No API key required, optimised for French addresses.
 */

export type GeoCoords = { lat: number; lng: number };

/**
 * Geocode a French city/postal code query. Returns null if geocoding fails or
 * returns no results.
 */
export async function geocodeAddress(query: string): Promise<GeoCoords | null> {
	try {
		const params = new URLSearchParams({
			q: query,
			limit: "1",
			autocomplete: "0",
		});
		const res = await fetch(
			`https://api-adresse.data.gouv.fr/search/?${params}`,
			{ signal: AbortSignal.timeout(4000) },
		);
		if (!res.ok) {
			return null;
		}
		const data = (await res.json()) as {
			features?: { geometry: { coordinates: [number, number] } }[];
		};
		const feature = data.features?.[0];
		if (!feature) {
			return null;
		}
		const [lng, lat] = feature.geometry.coordinates as [number, number];
		return { lat, lng };
	} catch {
		return null;
	}
}

/**
 * Haversine distance between two points, in km.
 */
export function haversineKm(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
