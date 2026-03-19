import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Input } from "./input";
import { Text } from "./typography";

interface AddressFeature {
	properties: {
		label: string;
		name: string;
		postcode: string;
		city: string;
		context: string;
		type: string;
	};
	geometry: {
		coordinates: [number, number]; // [lon, lat]
	};
}

export interface AddressAutocompleteProps {
	value: string;
	onChange: (address: string, city: string, postalCode: string) => void;
	error?: string;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
}

export function AddressAutocomplete({
	value,
	onChange,
	error,
	label = "Adresse complète",
	placeholder = "Ex: 123 Rue de la Musique",
	disabled = false,
}: AddressAutocompleteProps) {
	const [query, setQuery] = useState(value);
	const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	// Derived state: sync query with external value changes without a side-effect.
	// Using a ref comparison during render avoids the infinite-loop that the
	// previous effect + eslint-disable workaround was masking.
	const prevValueRef = useRef(value);
	if (prevValueRef.current !== value) {
		prevValueRef.current = value;
		setQuery(value);
	}

	const canSearch = useMemo(() => query.trim().length >= 3, [query]);

	useEffect(() => {
		if (!canSearch) {
			setSuggestions([]);
			setIsOpen(false);
			return;
		}

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
				const data = (await response.json()) as { features?: AddressFeature[] };
				const features = data.features ?? [];
				setSuggestions(features);
				setIsOpen(features.length > 0);
			} catch (err) {
				if ((err as { name?: string }).name !== "AbortError") {
					setSuggestions([]);
					setIsOpen(false);
				}
			} finally {
				setIsLoading(false);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [canSearch, query]);

	const handleSelect = (feature: AddressFeature) => {
		const props = feature.properties;
		const displayAddress = props.name;
		setQuery(displayAddress);
		setSuggestions([]);
		setIsOpen(false);
		onChange(displayAddress, props.city, props.postcode);
	};

	return (
		<View className="space-y-2">
			<Text className="mb-1 font-sans-medium text-foreground text-sm">
				{label} <Text className="text-red-500">*</Text>
			</Text>

			<View className="relative">
				<Input
					className={`rounded-lg border p-3 text-foreground ${
						error ? "border-red-500" : "border-border"
					} bg-background`}
					value={query}
					onChangeText={(text) => {
						setQuery(text);
						if (!text) {
							setSuggestions([]);
							setIsOpen(false);
						}
					}}
					placeholder={placeholder}
					placeholderTextColor="#666"
					editable={!disabled}
					onFocus={() => {
						if (suggestions.length > 0) setIsOpen(true);
					}}
				/>

				{isLoading ? (
					<View className="absolute top-3 right-3">
						<ActivityIndicator size="small" />
					</View>
				) : null}
			</View>

			{error ? <Text className="text-red-500 text-xs">{error}</Text> : null}

			{isOpen && suggestions.length > 0 ? (
				<View className="overflow-hidden rounded-lg border border-border bg-card">
					<ScrollView keyboardShouldPersistTaps="handled">
						{suggestions.map((feature) => {
							const props = feature.properties;
							const isLocality =
								props.type === "locality" || props.type === "municipality";
							const [lon, lat] = feature.geometry.coordinates;
							const key = `${props.label}-${lat}-${lon}`;

							return (
								<TouchableOpacity
									key={key}
									className="flex-row items-start gap-3 border-border border-b px-3 py-3"
									onPress={() => handleSelect(feature)}
								>
									<Ionicons
										name={isLocality ? "business-outline" : "location-outline"}
										size={18}
										color="#9ca3af"
										style={{ marginTop: 2 }}
									/>
									<View className="flex-1">
										<Text className="text-foreground">{props.label}</Text>
										<Text className="text-muted-foreground text-xs">
											{props.context}
										</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</ScrollView>
				</View>
			) : null}
		</View>
	);
}
