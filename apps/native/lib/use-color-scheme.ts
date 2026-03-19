import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useEffect } from "react";

const THEME_STORAGE_KEY = "rythmons:native:theme-preference";

export function useColorScheme() {
	const { colorScheme, setColorScheme, toggleColorScheme } =
		useNativewindColorScheme();

	// Restore persisted theme on mount
	useEffect(() => {
		AsyncStorage.getItem(THEME_STORAGE_KEY)
			.then((stored) => {
				if (stored === "light" || stored === "dark") {
					setColorScheme(stored);
				}
			})
			.catch(() => {});
	}, [setColorScheme]);

	// Persist when theme changes
	useEffect(() => {
		const value = colorScheme ?? "dark";
		AsyncStorage.setItem(THEME_STORAGE_KEY, value).catch(() => {});
	}, [colorScheme]);

	return {
		colorScheme: colorScheme ?? "dark",
		isDarkColorScheme: colorScheme === "dark",
		setColorScheme,
		toggleColorScheme,
	};
}
