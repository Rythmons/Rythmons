import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Text } from "./typography";

type VenueMarker = {
	id: string;
	name: string;
	city: string;
	latitude: number | null;
	longitude: number | null;
	photoUrl: string | null;
};

type MappableVenue = VenueMarker & { latitude: number; longitude: number };

interface SearchMapProps {
	venues: VenueMarker[];
}

export function SearchMap({ venues }: SearchMapProps) {
	const mappable = venues.filter(
		(v): v is MappableVenue => v.latitude != null && v.longitude != null,
	);

	if (mappable.length === 0) {
		return (
			<View style={styles.empty}>
				<Ionicons name="map-outline" size={36} color="#9ca3af" />
				<Text className="mt-3 text-center text-muted-foreground">
					Aucun lieu avec coordonnées n'est disponible pour ces critères.
				</Text>
			</View>
		);
	}

	const lats = mappable.map((v) => v.latitude);
	const lngs = mappable.map((v) => v.longitude);
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const minLng = Math.min(...lngs);
	const maxLng = Math.max(...lngs);

	return (
		<MapView
			style={styles.map}
			provider={PROVIDER_DEFAULT}
			initialRegion={{
				latitude: (minLat + maxLat) / 2,
				longitude: (minLng + maxLng) / 2,
				latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
				longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
			}}
		>
			{mappable.map((venue) => (
				<Marker
					key={venue.id}
					coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
					pinColor="#7c3aed"
				>
					<Callout
						onPress={() =>
							router.push({
								pathname: "/(drawer)/venue/[id]",
								params: { id: venue.id, backTo: "/(drawer)/search" },
							})
						}
					>
						<View style={styles.callout}>
							<Text className="font-sans-medium text-foreground text-sm">
								{venue.name}
							</Text>
							<Text className="text-muted-foreground text-xs">
								{venue.city}
							</Text>
							<TouchableOpacity style={styles.calloutBtn}>
								<Text className="text-center text-primary-foreground text-xs">
									Voir profil →
								</Text>
							</TouchableOpacity>
						</View>
					</Callout>
				</Marker>
			))}
		</MapView>
	);
}

const styles = StyleSheet.create({
	map: { flex: 1 },
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	callout: {
		minWidth: 160,
		padding: 8,
	},
	calloutBtn: {
		marginTop: 8,
		backgroundColor: "#7c3aed",
		borderRadius: 6,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
});
