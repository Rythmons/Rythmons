import { db } from "@rythmons/db";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { VenueSearch } from "./venue-search";

async function canAccessVenueSearch(userId: string, role?: string | null) {
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

export default async function VenueSearchPage() {
	const session = await getServerSession();

	if (!session.data) {
		redirect("/login");
	}

	const hasArtistAccess = await canAccessVenueSearch(
		session.data.user.id,
		session.data.user.role,
	);

	if (!hasArtistAccess) {
		redirect("/dashboard");
	}

	return <VenueSearch />;
}
