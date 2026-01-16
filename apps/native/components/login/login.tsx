import { useState } from "react";
import { View } from "react-native";
import { ForgotPassword } from "@/components/login/forgot-password";
import { SignIn } from "@/components/login/sign-in";
import { SignUp } from "@/components/login/sign-up";

type Mode = "signin" | "signup" | "forgot";

export function Login() {
	const [mode, setMode] = useState<Mode>("signin");

	if (mode === "forgot") {
		return (
			<ForgotPassword
				onSwitchToSignIn={() => setMode("signin")}
				onSwitchToSignUp={() => setMode("signup")}
			/>
		);
	}

	if (mode === "signup") {
		return <SignUp onSwitchToSignIn={() => setMode("signin")} />;
	}

	return (
		<SignIn
			onSwitchToSignUp={() => setMode("signup")}
			onSwitchToForgotPassword={() => setMode("forgot")}
		/>
	);
}
