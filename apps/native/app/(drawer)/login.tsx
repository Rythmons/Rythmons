import { useCallback, useEffect, useRef } from "react";
import {
	findNodeHandle,
	InteractionManager,
	Keyboard,
	Platform,
	TextInput,
	UIManager,
	View,
} from "react-native";
import {
	KeyboardAwareScrollView,
	type KeyboardAwareScrollView as KeyboardAwareScrollViewType,
} from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Login } from "@/components/login/login";
import { Text, Title } from "@/components/ui/typography";

export default function LoginScreen() {
	const insets = useSafeAreaInsets();
	const scrollRef = useRef<KeyboardAwareScrollViewType | null>(null);
	const pendingInputTargetRef = useRef<number | null>(null);

	const scrollToInput = useCallback((target: number | null) => {
		const awareRef = scrollRef.current as
			| (KeyboardAwareScrollViewType & {
					scrollToPosition?: (x: number, y: number, animated?: boolean) => void;
					scrollTo?: (options: { y: number; animated?: boolean }) => void;
					getScrollResponder?: () => unknown;
			  })
			| null;
		const focusedInput = TextInput.State.currentlyFocusedInput?.();
		const inputHandle = focusedInput
			? findNodeHandle(focusedInput as never)
			: target;
		const responder =
			awareRef?.getScrollResponder?.() ?? (awareRef as unknown as object);
		const scrollHandle = responder ? findNodeHandle(responder as never) : null;

		if (!inputHandle || !scrollHandle) return;

		UIManager.measureLayout(
			inputHandle,
			scrollHandle,
			() => {},
			(_x, y) => {
				const nextY = Math.max(0, y - 24);
				if (awareRef?.scrollToPosition) {
					awareRef.scrollToPosition(0, nextY, true);
					return;
				}
				awareRef?.scrollTo?.({ y: nextY, animated: true });
			},
		);
	}, []);

	const handleInputFocus = useCallback(
		(target: number | null) => {
			pendingInputTargetRef.current = target;
			InteractionManager.runAfterInteractions(() => {
				scrollToInput(target);
			});
		},
		[scrollToInput],
	);

	useEffect(() => {
		const showSub = Keyboard.addListener("keyboardDidShow", () => {
			if (!pendingInputTargetRef.current) return;
			scrollToInput(pendingInputTargetRef.current);
		});
		return () => {
			showSub.remove();
		};
	}, [scrollToInput]);

	return (
		<View className="flex-1">
			<KeyboardAwareScrollView
				innerRef={(ref) => {
					scrollRef.current = ref;
				}}
				className="flex-1"
				enableOnAndroid
				extraScrollHeight={8}
				enableAutomaticScroll
				keyboardOpeningTime={0}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="interactive"
				contentInsetAdjustmentBehavior="automatic"
				automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
				extraHeight={0}
				contentContainerStyle={{
					paddingTop: Math.max(insets.top + 8, 16),
					paddingBottom: insets.bottom + 24,
					paddingHorizontal: 16,
				}}
			>
				<View className="mb-1 gap-2">
					<Title className="text-3xl text-foreground">Se connecter</Title>
					<Text className="max-w-[92%] text-muted-foreground text-sm">
						Une interface plus fluide, plus lisible et plus rapide pour publier,
						discuter et reserver.
					</Text>
				</View>
				<View>
					<Login onInputFocus={handleInputFocus} />
				</View>
			</KeyboardAwareScrollView>
		</View>
	);
}
