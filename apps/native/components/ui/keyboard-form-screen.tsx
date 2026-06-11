import type { ReactElement, ReactNode } from "react";
import type { RefreshControlProps } from "react-native";
import { Platform } from "react-native";
import {
	KeyboardAwareScrollView,
	type KeyboardAwareScrollView as KeyboardAwareScrollViewType,
} from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function KeyboardFormScreen({
	children,
	useTopInset = false,
	topInsetOffset = 8,
	bottomInsetOffset = 24,
	scrollRef,
	refreshControl,
}: {
	children: ReactNode;
	useTopInset?: boolean;
	topInsetOffset?: number;
	bottomInsetOffset?: number;
	scrollRef?: (ref: KeyboardAwareScrollViewType | null) => void;
	refreshControl?: ReactElement<RefreshControlProps>;
}) {
	const insets = useSafeAreaInsets();

	return (
		<KeyboardAwareScrollView
			innerRef={(ref) => scrollRef?.(ref)}
			className="flex-1"
			enableOnAndroid
			enableAutomaticScroll
			keyboardOpeningTime={0}
			extraScrollHeight={12}
			keyboardShouldPersistTaps="handled"
			keyboardDismissMode="interactive"
			contentInsetAdjustmentBehavior="automatic"
			automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
			refreshControl={refreshControl}
			contentContainerStyle={{
				paddingTop: useTopInset
					? Math.max(insets.top + topInsetOffset, 16)
					: 16,
				paddingBottom: insets.bottom + bottomInsetOffset,
				paddingHorizontal: 16,
			}}
		>
			{children}
		</KeyboardAwareScrollView>
	);
}
