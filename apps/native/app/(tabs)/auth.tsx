import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Loader } from "@/components/loader";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { useSignOut } from "@/lib/use-sign-out";

export default function AuthScreen() {
	const [showSignIn, setShowSignIn] = useState(true);
	const { data: session, isPending } = authClient.useSession();
	const headerHeight = useHeaderHeight();
	const insets = useSafeAreaInsets();
	const tabBarHeight = useBottomTabBarHeight();

	const keyboardVerticalOffset = useMemo(() => {
		const baseOffset = headerHeight ?? 0;
		if (Platform.OS === "android") {
			return baseOffset + insets.top;
		}
		return baseOffset;
	}, [headerHeight, insets.top]);

	const contentPaddingTop = useMemo(() => {
		return Math.max(insets.top + 8, 16);
	}, [insets.top]);

	const contentPaddingBottom = useMemo(() => {
		return tabBarHeight + insets.bottom + 48;
	}, [insets.bottom, tabBarHeight]);

	const { signOut, isSigningOut } = useSignOut();

	if (isPending) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Loader label="Chargement de la session…" />
				</View>
			</Container>
		);
	}

	return (
		<Container>
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={keyboardVerticalOffset}
			>
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						paddingTop: contentPaddingTop,
						paddingBottom: contentPaddingBottom,
					}}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
					contentInsetAdjustmentBehavior="always"
				>
					<View className="gap-5 px-4 pb-6">
						{session?.user ? (
							<View className="rounded-lg border border-border bg-card p-4">
								<Text className="mb-2 font-semibold text-foreground text-lg">
									Vous êtes connecté
								</Text>
								<Text className="text-muted-foreground">
									{session.user.name ?? session.user.email}
								</Text>
								<View className="mt-4 flex-row gap-3">
									<Link href="/(tabs)/dashboard" asChild>
										<TouchableOpacity className="flex-1 items-center justify-center rounded-md bg-primary px-4 py-2">
											<Text className="font-medium text-primary-foreground">
												Aller au tableau de bord
											</Text>
										</TouchableOpacity>
									</Link>
									<TouchableOpacity
										onPress={signOut}
										disabled={isSigningOut}
										className="items-center justify-center rounded-md border border-border px-4 py-2 disabled:opacity-70"
									>
										<Text className="font-medium text-foreground">
											{isSigningOut ? "Déconnexion…" : "Se déconnecter"}
										</Text>
									</TouchableOpacity>
								</View>
							</View>
						) : (
							<View className="gap-6">
								{showSignIn ? (
									<SignIn onSwitchToSignUp={() => setShowSignIn(false)} />
								) : (
									<SignUp onSwitchToSignIn={() => setShowSignIn(true)} />
								)}
								<GoogleAuthButton mode={showSignIn ? "sign-in" : "sign-up"} />
							</View>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Container>
	);
}
