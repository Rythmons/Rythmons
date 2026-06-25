import { db } from "@rythmons/db";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "@/lib/auth-server";
import { VenueSearch } from "./venue-search";

function VenueSearchFallback() {
	return (
		<div className="container mx-auto max-w-6xl px-4 py-5">
			<div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
				<Loader2 className="h-5 w-5 animate-spin" />
				<span className="ml-2 text-sm">Chargement de la recherche...</span>
			</div>
		</div>
	);
}

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
		return (
			<Suspense fallback={<VenueSearchFallback />}>
				<VenueSearch canSearchVenues={false} canSearchArtists={false} />
			</Suspense>
		);
	}

	return (
		<Suspense fallback={<VenueSearchFallback />}>
			<VenueSearch
				canSearchVenues={canSearchVenues}
				canSearchArtists={canSearchArtists}
			/>
		</Suspense>
	);
}
