import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type ArtistMenuItem = {
	id: string;
};

type VenueMenuItem = {
	id: string;
};

export default function TabLayout() {
	const insets = useSafeAreaInsets();
	const { data: session } = authClient.useSession();
	const sessionRole = (
		session?.user as
			| {
					role?: "ARTIST" | "ORGANIZER" | "BOTH" | null;
			  }
			| undefined
	)?.role;
	const hasArtistRole = sessionRole === "ARTIST" || sessionRole === "BOTH";
	const hasOrganizerRole =
		sessionRole === "ORGANIZER" || sessionRole === "BOTH";
	const { data: artists } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: Boolean(session?.user) && !hasArtistRole,
	});
	const { data: venues } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: Boolean(session?.user) && !hasOrganizerRole,
	});
	const canSearchVenues =
		hasArtistRole || ((artists ?? []) as ArtistMenuItem[]).length > 0;
	const canSearchArtists =
		hasOrganizerRole || ((venues ?? []) as VenueMenuItem[]).length > 0;
	const canUseSearch = canSearchVenues || canSearchArtists;
	const canManageArtists = canSearchVenues;
	const canManageVenues = canSearchArtists;
	const shouldShowArtistTab = canManageArtists && !canManageVenues;
	const shouldShowVenueTab = canManageVenues && !canManageArtists;

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarHideOnKeyboard: true,
				sceneStyle: {
					backgroundColor: "hsl(278 86% 3%)",
				},
				tabBarLabelStyle: {
					fontFamily: "Montserrat-Medium",
					fontSize: 11,
				},
				tabBarStyle: {
					height: 60 + insets.bottom,
					paddingTop: 8,
					paddingBottom: Math.max(8, insets.bottom),
					backgroundColor: "hsl(280 93% 6%)",
					borderTopColor: "hsl(280 40% 14%)",
				},
				tabBarActiveTintColor: "hsl(348 91% 52%)",
				tabBarInactiveTintColor: "hsl(289 15% 60%)",
			}}
		>
			{/* Accueil */}
			<Tabs.Screen
				name="index"
				options={{
					headerShown: false,
					tabBarLabel: "Accueil",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="profile"
				options={{
					tabBarLabel: "Profil",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person-circle-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="artist"
				options={{
					tabBarLabel: "Artistes",
					href: shouldShowArtistTab ? undefined : null,
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="musical-notes-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					tabBarLabel: "Recherche",
					href: canUseSearch ? undefined : null,
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="search-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="bookings"
				options={{
					href: session?.user ? undefined : null,
					tabBarLabel: "Bookings",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="calendar-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="venue"
				options={{
					tabBarLabel: "Lieu",
					href: shouldShowVenueTab ? undefined : null,
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="business-outline" size={size} color={color} />
					),
				}}
			/>

			{/* Login */}
			<Tabs.Screen
				name="login"
				options={{
					headerShown: false,
					tabBarLabel: "Connexion",
					href: session?.user ? null : undefined, // Cache l'onglet si l'utilisateur est connecté
					tabBarIcon: ({ color, size }) => (
						<MaterialIcons name="login" size={size} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="(tabs)"
				options={{
					href: null,
				}}
			/>

			{/* Routes masquées du menu bas */}
			<Tabs.Screen
				name="artist/new"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="artist/[id]"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="venue/[id]"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="venue/new"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="venue/edit/[id]"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="bookings/[id]"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="bookings/propose"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="calendar"
				options={{
					href: null,
				}}
			/>
		</Tabs>
	);
}
