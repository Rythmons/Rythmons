import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect } from "react";
import { BackHandler, TouchableOpacity } from "react-native";

type BackTarget = string | null | undefined;

export function useContextualBackNavigation(fallbackHref?: BackTarget) {
	const navigation = useNavigation();

	const handleBack = useCallback(() => {
		if (fallbackHref) {
			router.replace(fallbackHref as never);
			return true;
		}

		if (navigation.canGoBack()) {
			navigation.goBack();
			return true;
		}

		return false;
	}, [fallbackHref, navigation]);

	useLayoutEffect(() => {
		if (!fallbackHref) {
			return;
		}

		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity onPress={handleBack} className="px-1" hitSlop={10}>
					<Ionicons name="arrow-back" size={24} color="#7c3aed" />
				</TouchableOpacity>
			),
		});
	}, [fallbackHref, handleBack, navigation]);

	useFocusEffect(
		useCallback(() => {
			const subscription = BackHandler.addEventListener(
				"hardwareBackPress",
				() => {
					if (fallbackHref) {
						return handleBack();
					}

					if (navigation.canGoBack()) {
						return false;
					}

					return handleBack();
				},
			);

			return () => subscription.remove();
		}, [fallbackHref, handleBack, navigation]),
	);

	return handleBack;
}
