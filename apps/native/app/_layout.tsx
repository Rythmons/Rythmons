import {
	DarkTheme,
	DefaultTheme,
	type Theme,
	ThemeProvider,
} from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { FugazOne_400Regular } from "@expo-google-fonts/fugaz-one";
import {
	Montserrat_400Regular,
	Montserrat_500Medium,
	Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "@rythmons/auth/client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient } from "@/utils/trpc";

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const hasMounted = useRef(false);
	const { colorScheme, isDarkColorScheme } = useColorScheme();
	const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

	const [persister, setPersister] = useState(() => {
		// Fallback to in-memory persistence to avoid crashes when the native
		// AsyncStorage module isn't available at startup.
		const memory = new Map<string, string>();
		return createAsyncStoragePersister({
			key: "rythmons:react-query-cache",
			throttleTime: 2000,
			storage: {
				getItem: async (key: string) => memory.get(key) ?? null,
				setItem: async (key: string, value: string) => {
					memory.set(key, value);
				},
				removeItem: async (key: string) => {
					memory.delete(key);
				},
			},
		});
	});

	const [loaded, error] = useFonts({
		"Montserrat-Regular": Montserrat_400Regular,
		"Montserrat-Medium": Montserrat_500Medium,
		"Montserrat-Bold": Montserrat_700Bold,
		"FugazOne-Regular": FugazOne_400Regular,
	});

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	useIsomorphicLayoutEffect(() => {
		if (hasMounted.current) {
			return;
		}

		if (Platform.OS === "web") {
			document.documentElement.classList.add("bg-background");
		}
		setAndroidNavigationBar(colorScheme);
		setIsColorSchemeLoaded(true);
		hasMounted.current = true;
	}, []);

	useEffect(() => {
		// Upgrade the persister to AsyncStorage only if it is usable.
		// When the native module is missing, AsyncStorage.getItem throws.
		(async () => {
			if (Platform.OS === "web") return;
			try {
				await AsyncStorage.getItem("rythmons:async-storage:probe");
				setPersister(
					createAsyncStoragePersister({
						storage: AsyncStorage,
						key: "rythmons:react-query-cache",
						throttleTime: 2000,
					}),
				);
			} catch {
				// Keep in-memory persister.
			}
		})().catch(() => {
			// Keep in-memory persister.
		});
	}, []);

	if (!isColorSchemeLoaded || !loaded) {
		return null;
	}
	return (
		<AuthProvider client={authClient}>
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister,
					maxAge: 24 * 60 * 60 * 1000,
				}}
			>
				<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
					<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
					<GestureHandlerRootView style={{ flex: 1 }}>
						<Stack
							screenOptions={{
								headerTitleStyle: {
									fontFamily: "Montserrat-Bold",
								},
								headerBackTitleStyle: {
									fontFamily: "Montserrat-Regular",
								},
							}}
						>
							<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
							<Stack.Screen
								name="modal"
								options={{ title: "Modale", presentation: "modal" }}
							/>
							<Stack.Screen
								name="verify-email"
								options={{
									title: "Vérification e-mail",
									headerBackTitle: "Retour",
								}}
							/>
						</Stack>
					</GestureHandlerRootView>
				</ThemeProvider>
			</PersistQueryClientProvider>
		</AuthProvider>
	);
}

const useIsomorphicLayoutEffect =
	Platform.OS === "web" && typeof window === "undefined"
		? React.useEffect
		: React.useLayoutEffect;
