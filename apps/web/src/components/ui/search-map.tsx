"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useMemo, useRef, useState } from "react";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";
import MapGL, {
	Layer,
	NavigationControl,
	Popup,
	Source,
} from "react-map-gl/maplibre";

// Stadia Maps — Alidade Smooth Dark (free on localhost; add domain to allowlist for production)
const MAP_STYLE =
	"https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json";

type VenueMarker = {
	id: string;
	name: string;
	city: string;
	latitude: number | null;
	longitude: number | null;
	photoUrl: string | null;
};

type MappableVenue = VenueMarker & { latitude: number; longitude: number };

interface PopupInfo {
	id: string;
	name: string;
	city: string;
	photoUrl: string | null;
	longitude: number;
	latitude: number;
}

interface SearchMapProps {
	venues: VenueMarker[];
}

export default function SearchMap({ venues }: SearchMapProps) {
	const mapRef = useRef<MapRef>(null);
	const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
	const [cursor, setCursor] = useState("grab");

	const mappable = venues.filter(
		(v): v is MappableVenue => v.latitude != null && v.longitude != null,
	);

	const geojson = useMemo(
		() => ({
			type: "FeatureCollection" as const,
			features: mappable.map((v) => ({
				type: "Feature" as const,
				properties: {
					id: v.id,
					name: v.name,
					city: v.city,
					photoUrl: v.photoUrl ?? null,
				},
				geometry: {
					type: "Point" as const,
					coordinates: [v.longitude, v.latitude],
				},
			})),
		}),
		[mappable],
	);

	const initialViewState = useMemo(() => {
		if (mappable.length === 0)
			return { longitude: 1.888334, latitude: 46.603354, zoom: 5 };
		const lngs = mappable.map((v) => v.longitude);
		const lats = mappable.map((v) => v.latitude);
		return {
			longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
			latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
			zoom: mappable.length === 1 ? 12 : 5,
		};
	}, [mappable]);

	const onClick = useCallback(async (event: MapLayerMouseEvent) => {
		const feature = event.features?.[0];
		if (!feature) {
			setPopupInfo(null);
			return;
		}

		if (feature.layer.id === "clusters") {
			const clusterId = feature.properties?.cluster_id as number;
			const map = mapRef.current?.getMap();
			const source = map?.getSource("venues") as
				| maplibregl.GeoJSONSource
				| undefined;
			if (!source) return;
			const zoom = await source.getClusterExpansionZoom(clusterId);
			const coords = (feature.geometry as GeoJSON.Point).coordinates as [
				number,
				number,
			];
			map?.easeTo({ center: coords, zoom, duration: 500 });
			return;
		}

		if (feature.layer.id === "unclustered-point") {
			const coords = (feature.geometry as GeoJSON.Point).coordinates as [
				number,
				number,
			];
			const props = feature.properties;
			setPopupInfo({
				id: props?.id,
				name: props?.name,
				city: props?.city,
				photoUrl: props?.photoUrl ?? null,
				longitude: coords[0],
				latitude: coords[1],
			});
		}
	}, []);

	const onMouseEnter = useCallback(() => setCursor("pointer"), []);
	const onMouseLeave = useCallback(() => setCursor("grab"), []);

	return (
		<div
			className="relative overflow-hidden rounded-xl border"
			style={{ height: "520px", isolation: "isolate" }}
		>
			<MapGL
				ref={mapRef}
				initialViewState={initialViewState}
				mapStyle={MAP_STYLE}
				mapLib={maplibregl}
				style={{ width: "100%", height: "100%" }}
				interactiveLayerIds={["clusters", "unclustered-point"]}
				onClick={onClick}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				cursor={cursor}
			>
				<NavigationControl position="top-right" />

				<Source
					id="venues"
					type="geojson"
					data={geojson}
					cluster
					clusterMaxZoom={14}
					clusterRadius={60}
				>
					{/* Cluster circles */}
					<Layer
						id="clusters"
						type="circle"
						filter={["has", "point_count"]}
						paint={{
							"circle-color": [
								"step",
								["get", "point_count"],
								"#18181b",
								10,
								"#3f3f46",
								30,
								"#52525b",
							],
							"circle-radius": [
								"step",
								["get", "point_count"],
								22,
								10,
								30,
								30,
								38,
							],
							"circle-stroke-width": 2,
							"circle-stroke-color": "#ffffff",
						}}
					/>
					{/* Cluster count labels */}
					<Layer
						id="cluster-count"
						type="symbol"
						filter={["has", "point_count"]}
						layout={{
							"text-field": ["get", "point_count_abbreviated"],
							"text-size": 13,
							"text-font": ["Noto Sans Bold", "Noto Sans Regular"],
						}}
						paint={{ "text-color": "#ffffff" }}
					/>
					{/* Individual venue dots */}
					<Layer
						id="unclustered-point"
						type="circle"
						filter={["!", ["has", "point_count"]]}
						paint={{
							"circle-color": "#18181b",
							"circle-radius": 9,
							"circle-stroke-width": 2.5,
							"circle-stroke-color": "#ffffff",
						}}
					/>
				</Source>

				{popupInfo ? (
					<Popup
						longitude={popupInfo.longitude}
						latitude={popupInfo.latitude}
						anchor="bottom"
						onClose={() => setPopupInfo(null)}
						closeButton
					>
						<div style={{ minWidth: 160, fontSize: 14, lineHeight: 1.4 }}>
							{popupInfo.photoUrl ? (
								/* biome-ignore lint/performance/noImgElement: map popup uses remote venue photo */
								<img
									src={popupInfo.photoUrl}
									alt={popupInfo.name}
									style={{
										width: "100%",
										height: 96,
										objectFit: "cover",
										borderRadius: 6,
										marginBottom: 8,
									}}
								/>
							) : null}
							<p style={{ fontWeight: 600, margin: "0 0 4px" }}>
								{popupInfo.name}
							</p>
							<p style={{ color: "#6b7280", margin: "0 0 10px", fontSize: 12 }}>
								{popupInfo.city}
							</p>
							<a
								href={`/venue/${popupInfo.id}`}
								style={{
									display: "inline-block",
									background: "#18181b",
									color: "#fff",
									padding: "4px 14px",
									borderRadius: 6,
									textDecoration: "none",
									fontSize: 12,
								}}
							>
								Voir profil →
							</a>
						</div>
					</Popup>
				) : null}
			</MapGL>

			{mappable.length < venues.length ? (
				<p className="absolute right-3 bottom-3 z-[1000] rounded bg-background/90 px-2 py-1 text-muted-foreground text-xs backdrop-blur-sm">
					{venues.length - mappable.length} lieu(x) sans coordonnées masqué(s)
				</p>
			) : null}
		</div>
	);
}
