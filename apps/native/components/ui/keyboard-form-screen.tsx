import type { ReactNode } from "react";
import { Platform } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function KeyboardFormScreen({ children }: { children: ReactNode }) {
	const insets = useSafeAreaInsets();

	return (
		<KeyboardAwareScrollView
			className="flex-1"
			enableOnAndroid
			enableAutomaticScroll
			keyboardOpeningTime={0}
			extraScrollHeight={12}
			keyboardShouldPersistTaps="handled"
			keyboardDismissMode="interactive"
			contentInsetAdjustmentBehavior="automatic"
			automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
			contentContainerStyle={{
				paddingTop: Math.max(insets.top + 8, 16),
				paddingBottom: insets.bottom + 24,
				paddingHorizontal: 16,
			}}
		>
			{children}
		</KeyboardAwareScrollView>
	);
}
