// French labels for venue types
export const VENUE_TYPE_LABELS: Record<string, string> = {
	BAR: "Bar",
	CLUB: "Club / Discothèque",
	CONCERT_HALL: "Salle de concert",
	FESTIVAL: "Festival",
	CAFE: "Café-concert",
	RESTAURANT: "Restaurant",
	CULTURAL_CENTER: "Centre culturel",
	THEATER: "Théâtre",
	OPEN_AIR: "Plein air",
	OTHER: "Autre",
};

/**
 * Get the French label for a venue type
 * @param venueType The venue type value (e.g., "CONCERT_HALL")
 * @returns The French label (e.g., "Salle de concert")
 */
export function getVenueTypeLabel(venueType: string): string {
	return VENUE_TYPE_LABELS[venueType] || venueType.replace(/_/g, " ");
}
