"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState } from "react";
import MapGL, { Marker, Popup } from "react-map-gl/maplibre";
import { MAP_MARKER_STYLE, MAP_STYLE } from "@/lib/map-style";

interface VenueMapProps {
	address: string;
	city: string;
	name: string;
}

export default function VenueMap({ address, city, name }: VenueMapProps) {
	const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
		null,
	);
	const [error, setError] = useState(false);
	const [showPopup, setShowPopup] = useState(false);

	useEffect(() => {
		if (!address || !city) return;

		const query = `${address} ${city}`;
		fetch(
			`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`,
		)
			.then((res) => res.json())
			.then((data) => {
				if (data.features && data.features.length > 0) {
					const [lon, lat] = data.features[0].geometry.coordinates;
					setCoords({ lat, lon });
				} else {
					setError(true);
				}
			})
			.catch((err) => {
				console.error("Geocoding error:", err);
				setError(true);
			});
	}, [address, city]);

	if (error) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">
				Carte non disponible pour cette adresse
			</div>
		);
	}

	if (!coords) {
		return (
			<div className="flex h-full w-full animate-pulse items-center justify-center bg-muted">
				<span className="text-muted-foreground text-sm">
					Chargement de la carte...
				</span>
			</div>
		);
	}

	return (
		<MapGL
			initialViewState={{
				longitude: coords.lon,
				latitude: coords.lat,
				zoom: 13,
			}}
			mapStyle={MAP_STYLE}
			mapLib={maplibregl}
			style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
			attributionControl={false}
		>
			<Marker
				longitude={coords.lon}
				latitude={coords.lat}
				anchor="center"
				onClick={() => setShowPopup(true)}
			>
				<div
					style={{
						width: MAP_MARKER_STYLE.size,
						height: MAP_MARKER_STYLE.size,
						borderRadius: "50%",
						background: MAP_MARKER_STYLE.background,
						border: MAP_MARKER_STYLE.border,
						cursor: "pointer",
					}}
				/>
			</Marker>
			{showPopup ? (
				<Popup
					longitude={coords.lon}
					latitude={coords.lat}
					anchor="bottom"
					onClose={() => setShowPopup(false)}
					closeButton
					offset={12}
				>
					<div className="text-center text-sm">
						<strong className="mb-1 block">{name}</strong>
						<span className="block text-xs">{address}</span>
						<span className="block text-xs">{city}</span>
					</div>
				</Popup>
			) : null}
		</MapGL>
	);
}
