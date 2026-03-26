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

	return (
		<Tabs
			screenOptions={{
				headerShown: true,
				tabBarHideOnKeyboard: true,
				// Avoid default Expo Router segment titles (e.g. "(drawer)", "new", etc.)
				// when a specific screen doesn't provide `headerTitle` explicitly.
				headerTitle: "",
				headerBackTitleVisible: false,
				sceneStyle: {
					backgroundColor: "hsl(278 86% 3%)",
				},
				headerStyle: {
					backgroundColor: "hsl(278 86% 3%)",
					borderBottomWidth: 1,
					borderBottomColor: "hsl(280 40% 14%)",
					elevation: 0,
				},
				headerShadowVisible: false,
				headerTintColor: "hsl(289 10% 95%)",
				headerTitleStyle: {
					fontFamily: "Montserrat-Bold",
					fontSize: 18,
					letterSpacing: 0.2,
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
					headerTitle: "Mon Profil",
					tabBarLabel: "Profil",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person-circle-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="artist"
				options={{
					headerTitle: "Mes Artistes",
					tabBarLabel: "Artistes",
					href: canManageArtists ? undefined : null,
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="musical-notes-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					headerTitle: "Recherche",
					tabBarLabel: "Recherche",
					href: canUseSearch ? undefined : null,
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="search-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="venue"
				options={{
					headerTitle: "Mon Lieu",
					tabBarLabel: "Lieu",
					href: canManageVenues ? undefined : null,
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
					headerTitle: "Nouvel Artiste",
					href: null,
				}}
			/>
			<Tabs.Screen
				name="artist/[id]"
				options={{
					headerTitle: "Fiche Artiste",
					href: null,
				}}
			/>
			<Tabs.Screen
				name="venue/[id]"
				options={{
					headerTitle: "Fiche Lieu",
					href: null,
				}}
			/>
			<Tabs.Screen
				name="venue/new"
				options={{
					headerTitle: "Nouveau Lieu",
					href: null,
				}}
			/>
			<Tabs.Screen
				name="venue/edit/[id]"
				options={{
					headerTitle: "Modification Lieu",
					href: null,
				}}
			/>
		</Tabs>
	);
}
