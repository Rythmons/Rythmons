import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Login } from "@/components/login/login"; // your Login component with SignIn/SignUp/ForgotPassword

export default function LoginScreen() {
	const headerHeight = useHeaderHeight();
	const insets = useSafeAreaInsets();

	return (
		<KeyboardAvoidingView
			className="flex-1"
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={headerHeight + insets.top}
		>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					flexGrow: 1,
					paddingTop: Math.max(insets.top + 8, 16),
					paddingBottom: insets.bottom + 24,
					paddingHorizontal: 16,
				}}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="interactive"
				contentInsetAdjustmentBehavior="always"
			>
				<View className="flex-1">
					<Login />
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
