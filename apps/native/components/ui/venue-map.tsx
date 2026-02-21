import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import { Text } from "./typography";

interface VenueMapProps {
	address: string;
	city: string;
	onPress?: () => void;
}

type Coords = { lat: number; lon: number };

export function VenueMap({ address, city, onPress }: VenueMapProps) {
	const [coords, setCoords] = useState<Coords | null>(null);
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const query = useMemo(() => {
		const q = `${address} ${city}`.trim();
		return q.length > 0 ? q : "";
	}, [address, city]);

	useEffect(() => {
		if (!query) return;

		let cancelled = false;
		setIsLoading(true);
		setError(false);
		setCoords(null);

		fetch(
			`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`,
		)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.then((res) => res.json() as Promise<{ features?: any[] }>)
			.then((data) => {
				if (cancelled) return;
				const feature = data.features?.[0];
				const coordsArr = feature?.geometry?.coordinates as
					| [number, number]
					| undefined;
				if (!coordsArr) {
					setError(true);
					return;
				}
				const [lon, lat] = coordsArr;
				setCoords({ lat, lon });
			})
			.catch(() => {
				if (!cancelled) setError(true);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [query]);

	if (isLoading) {
		return (
			<View className="aspect-video w-full items-center justify-center rounded-lg border border-border bg-muted">
				<ActivityIndicator />
				<Text className="mt-2 text-muted-foreground text-xs">
					Chargement de la carte…
				</Text>
			</View>
		);
	}

	if (error || !coords) {
		return (
			<View className="aspect-video w-full items-center justify-center rounded-lg border border-border bg-muted p-4">
				<Ionicons name="map-outline" size={18} color="#9ca3af" />
				<Text className="mt-2 text-center text-muted-foreground text-xs">
					Carte non disponible pour cette adresse
				</Text>
			</View>
		);
	}

	const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lon}&zoom=13&size=600x300&maptype=mapnik&markers=${coords.lat},${coords.lon},red-pushpin`;

	return (
		<TouchableOpacity
			className="overflow-hidden rounded-lg border border-border bg-card"
			onPress={onPress}
			disabled={!onPress}
			activeOpacity={0.9}
		>
			<Image source={{ uri: mapUrl }} className="aspect-video w-full" />
			{onPress ? (
				<View className="absolute right-2 bottom-2 rounded-full bg-black/60 px-3 py-2">
					<View className="flex-row items-center">
						<Ionicons name="open-outline" size={16} color="white" />
						<Text className="ml-2 text-white text-xs">Ouvrir</Text>
					</View>
				</View>
			) : null}
		</TouchableOpacity>
	);
}
