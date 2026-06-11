import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ForgotPassword } from "@/components/login/forgot-password";
import { SignIn } from "@/components/login/sign-in";
import { SignUp } from "@/components/login/sign-up";
import { Text } from "@/components/ui/typography";

type Mode = "signin" | "signup" | "forgot";

type Props = {
	onInputFocus?: (target: number | null) => void;
};

export function Login({ onInputFocus }: Props) {
	const [mode, setMode] = useState<Mode>("signin");

	const tab = (
		<View className="mt-4 flex-row rounded-xl border border-border bg-muted p-1">
			<TouchableOpacity
				className={`flex-1 rounded-lg px-3 py-2 ${
					mode === "signin" ? "bg-card" : ""
				}`}
				onPress={() => setMode("signin")}
			>
				<Text
					className={`text-center text-sm ${
						mode === "signin"
							? "font-sans-bold text-foreground"
							: "text-muted-foreground"
					}`}
				>
					Connexion
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				className={`flex-1 rounded-lg px-3 py-2 ${
					mode === "signup" ? "bg-card" : ""
				}`}
				onPress={() => setMode("signup")}
			>
				<Text
					className={`text-center text-sm ${
						mode === "signup"
							? "font-sans-bold text-foreground"
							: "text-muted-foreground"
					}`}
				>
					Inscription
				</Text>
			</TouchableOpacity>
		</View>
	);

	if (mode === "forgot") {
		return (
			<>
				{tab}
				<ForgotPassword
					onSwitchToSignIn={() => setMode("signin")}
					onSwitchToSignUp={() => setMode("signup")}
					onInputFocus={onInputFocus}
				/>
			</>
		);
	}

	if (mode === "signup") {
		return (
			<>
				{tab}
				<SignUp
					onSwitchToSignIn={() => setMode("signin")}
					onInputFocus={onInputFocus}
				/>
			</>
		);
	}

	return (
		<>
			{tab}
			<SignIn
				onSwitchToSignUp={() => setMode("signup")}
				onSwitchToForgotPassword={() => setMode("forgot")}
				onInputFocus={onInputFocus}
			/>
		</>
	);
}
