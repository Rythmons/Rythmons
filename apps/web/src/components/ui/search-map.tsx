"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Fix leaflet default icon issue with webpack
const customIcon = L.icon({
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

type VenueMarker = {
	id: string;
	name: string;
	city: string;
	latitude: number | null;
	longitude: number | null;
	photoUrl: string | null;
};

interface SearchMapProps {
	venues: VenueMarker[];
}

export default function SearchMap({ venues }: SearchMapProps) {
	const mappable = venues.filter(
		(v): v is VenueMarker & { latitude: number; longitude: number } =>
			v.latitude != null && v.longitude != null,
	);

	// Compute center from all markers, or default to center of France
	const center: [number, number] =
		mappable.length > 0
			? [
					mappable.reduce((sum, v) => sum + v.latitude, 0) / mappable.length,
					mappable.reduce((sum, v) => sum + v.longitude, 0) / mappable.length,
				]
			: [46.603354, 1.888334];

	const zoom = mappable.length === 1 ? 12 : mappable.length > 1 ? 7 : 5;

	return (
		<div
			className="relative overflow-hidden rounded-xl border"
			style={{ height: "520px" }}
		>
			<MapContainer
				center={center}
				zoom={zoom}
				style={{ height: "100%", width: "100%" }}
				scrollWheelZoom
			>
				<TileLayer
					url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
				/>
				{mappable.map((venue) => (
					<Marker
						key={venue.id}
						position={[venue.latitude, venue.longitude]}
						icon={customIcon}
					>
						<Popup>
							<div className="min-w-[160px] space-y-2 p-1 text-sm">
								{venue.photoUrl ? (
									// biome-ignore lint/performance/noImgElement: venue photo in map popup
									<img
										src={venue.photoUrl}
										alt={venue.name}
										className="h-24 w-full rounded object-cover"
									/>
								) : null}
								<p className="font-semibold">{venue.name}</p>
								<p className="text-gray-500">{venue.city}</p>
								<Link
									href={`/venue/${venue.id}`}
									className="mt-1 inline-block rounded bg-primary px-3 py-1 text-primary-foreground text-xs hover:bg-primary/90"
								>
									Voir profil →
								</Link>
							</div>
						</Popup>
					</Marker>
				))}
			</MapContainer>
			{mappable.length < venues.length ? (
				<p className="absolute right-3 bottom-3 z-[1000] rounded bg-background/90 px-2 py-1 text-muted-foreground text-xs backdrop-blur-sm">
					{venues.length - mappable.length} lieu(x) sans coordonnées masqué(s)
				</p>
			) : null}
		</div>
	);
}
