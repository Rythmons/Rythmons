import { db } from "@rythmons/db";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { VenueSearch } from "./venue-search";

async function canAccessVenueSearch(userId: string, role?: string | null) {
	// If the user has no role yet, keep the search accessible (onboarding happens in UI).
	if (!role) return true;
	if (role === "ARTIST" || role === "BOTH") {
		return true;
	}

	const artistCount = await db.artist.count({
		where: {
			userId,
		},
	});

	return artistCount > 0;
}

async function canAccessArtistSearch(userId: string, role?: string | null) {
	// If the user has no role yet, keep the search accessible (onboarding happens in UI).
	if (!role) return true;
	if (role === "ORGANIZER" || role === "BOTH") {
		return true;
	}

	const venueCount = await db.venue.count({
		where: {
			ownerId: userId,
		},
	});

	return venueCount > 0;
}

export default async function VenueSearchPage() {
	const session = await getServerSession();

	if (!session.data) {
		redirect("/login");
	}

	const [canSearchVenues, canSearchArtists] = await Promise.all([
		canAccessVenueSearch(session.data.user.id, session.data.user.role),
		canAccessArtistSearch(session.data.user.id, session.data.user.role),
	]);

	if (!canSearchVenues && !canSearchArtists) {
		// Don't hard-block the feature: show the search page and let the UI explain
		// what the user needs to do (create a profile / set a role) to use it.
		return <VenueSearch canSearchVenues={false} canSearchArtists={false} />;
	}

	return (
		<VenueSearch
			canSearchVenues={canSearchVenues}
			canSearchArtists={canSearchArtists}
		/>
	);
}
