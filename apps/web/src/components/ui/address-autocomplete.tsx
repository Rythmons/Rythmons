"use client";

import { Building2, Loader2, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AddressFeature {
	properties: {
		label: string;
		name: string;
		postcode: string;
		city: string;
		context: string;
		type: string;
		street?: string;
		housenumber?: string;
		citycode?: string;
	};
	geometry: {
		coordinates: [number, number]; // [lon, lat]
	};
}

interface AddressAutocompleteProps {
	value?: string;
	onChange: (
		address: string,
		city: string,
		postalCode: string,
		lat?: number,
		lon?: number,
	) => void;
	error?: string;
	label?: string;
	placeholder?: string;
	className?: string;
}

export function AddressAutocomplete({
	value = "",
	onChange,
	error,
	label = "Adresse complète",
	placeholder = "Ex: 123 Rue de la Musique",
	className,
}: AddressAutocompleteProps) {
	const [query, setQuery] = useState(value);
	const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const abortRef = useRef<AbortController | null>(null);

	// Derived state: sync query with external value changes without a side-effect.
	// Using a ref comparison during render avoids the infinite-loop that would
	// occur if query were listed as a dep in an effect, and removes the need for
	// eslint-disable-next-line react-hooks/exhaustive-deps.
	const prevValueRef = useRef(value);
	if (prevValueRef.current !== value) {
		prevValueRef.current = value;
		setQuery(value);
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Debounce plus court pour plus de réactivité (300ms -> 200ms)
	useEffect(() => {
		if (!query || query === value || query.length < 3) return;

		const timer = setTimeout(async () => {
			// Abort any in-flight request before starting a new one, preventing
			// stale responses from overwriting fresher results.
			abortRef.current?.abort();
			abortRef.current = new AbortController();
			setIsLoading(true);
			try {
				const response = await fetch(
					`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`,
					{ signal: abortRef.current.signal },
				);
				const data = await response.json();
				if (data.features) {
					setSuggestions(data.features);
					setIsOpen(true);
				}
			} catch (err) {
				if ((err as { name?: string }).name !== "AbortError") {
					console.error("Error fetching address:", err);
				}
			} finally {
				setIsLoading(false);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [query, value]);

	const handleSelect = (feature: AddressFeature) => {
		const props = feature.properties;
		const [lon, lat] = feature.geometry.coordinates;

		// Construction intelligente de l'adresse pour le champ input
		// Si c'est un numéro + rue, on prend "name" (ex: "8 Boulevard de Bercy")
		// Si c'est un lieu-dit ou ville, on prend "name" ou "label"

		const displayAddress = props.name;
		const fullCity = props.city;
		const postcode = props.postcode;

		// Met à jour l'input avec juste la partie "Voie" (sans CP/Ville pour éviter la duplication)
		setQuery(displayAddress);
		setSuggestions([]);
		setIsOpen(false);

		onChange(displayAddress, fullCity, postcode, lat, lon);
	};

	return (
		<div className={cn("relative space-y-2", className)} ref={containerRef}>
			{label && (
				<Label>
					{label} <span className="text-destructive">*</span>
				</Label>
			)}
			<div className="relative">
				<Input
					value={query}
					onChange={(e) => {
						const nextQuery = e.target.value;
						setQuery(nextQuery);
						onChange(nextQuery, "", "");
						if (nextQuery === "") {
							setSuggestions([]);
							setIsOpen(false);
						}
					}}
					onFocus={() => {
						if (suggestions.length > 0) setIsOpen(true);
					}}
					placeholder={placeholder}
					autoComplete="off" // Bloque l'autocomplétion native du navigateur
					className={cn(
						error && "border-destructive focus-visible:ring-destructive",
					)}
				/>
				{isLoading && (
					<div className="absolute top-2.5 right-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>

			{error && <p className="text-destructive text-sm">{error}</p>}

			{isOpen && suggestions.length > 0 && (
				<div className="fade-in-0 zoom-in-95 absolute z-50 mt-1 w-full animate-in rounded-md border bg-popover p-1 shadow-md">
					<ul className="max-h-60 overflow-auto">
						{suggestions.map((feature) => {
							const props = feature.properties;
							// Distinction visuelle simple
							const isLocality =
								props.type === "locality" || props.type === "municipality";

							const [lon, lat] = feature.geometry.coordinates;
							const key = `${props.label}-${lat}-${lon}`;

							return (
								<li key={key}>
									<button
										type="button"
										className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
										onClick={() => handleSelect(feature)}
									>
										{isLocality ? (
											<Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
										) : (
											<MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
										)}
										<div className="flex flex-col overflow-hidden">
											<span className="truncate font-medium">
												{props.label}
											</span>
											<span className="truncate text-muted-foreground text-xs">
												{props.context}
											</span>
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
}
