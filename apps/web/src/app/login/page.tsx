"use client";

import { useState } from "react";
import ForgottenPassword from "@/components/forgotten-password";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
	const [showSignIn, setShowSignIn] = useState(true);
	const [showForgottenPassword, setShowForgottenPassword] = useState(false);

	return showForgottenPassword ? (
		<ForgottenPassword
			onSwitchToSignIn={() => {
				setShowSignIn(true);
				setShowForgottenPassword(false);
			}}
			onSwitchToSignUp={() => setShowSignIn(false)}
		/>
	) : showSignIn ? (
		<SignInForm
			onSwitchToSignUp={() => setShowSignIn(false)}
			onSwitchToForgottenPassword={() => setShowForgottenPassword(true)}
		/>
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
