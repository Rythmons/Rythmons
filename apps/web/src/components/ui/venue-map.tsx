"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon issue
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl =
	"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl =
	"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const customIcon = L.icon({
	iconUrl,
	iconRetinaUrl,
	shadowUrl,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

interface VenueMapProps {
	address: string;
	city: string;
	name: string;
}

export default function VenueMap({ address, city, name }: VenueMapProps) {
	const [coords, setCoords] = useState<[number, number] | null>(null);
	const [error, setError] = useState(false);

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
					setCoords([lat, lon]);
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
		<MapContainer
			center={coords}
			zoom={13}
			style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
			zoomControl={false}
		>
			<TileLayer
				url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
			/>
			<Marker position={coords} icon={customIcon}>
				<Popup>
					<div className="text-center">
						<strong className="mb-1 block">{name}</strong>
						<span className="block text-xs">{address}</span>
						<span className="block text-xs">{city}</span>
					</div>
				</Popup>
			</Marker>
		</MapContainer>
	);
}
