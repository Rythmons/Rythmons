"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import ForgottenPassword from "@/components/forgotten-password";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

function LoginContent() {
	const searchParams = useSearchParams();
	const signupParam = searchParams.get("signup") === "1";
	const [showSignIn, setShowSignIn] = useState(!signupParam);
	const [showForgottenPassword, setShowForgottenPassword] = useState(false);

	return showForgottenPassword ? (
		<ForgottenPassword
			onSwitchToSignIn={() => {
				setShowSignIn(true);
				setShowForgottenPassword(false);
			}}
			onSwitchToSignUp={() => {
				setShowForgottenPassword(false);
				setShowSignIn(false);
			}}
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

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="mx-auto mt-10 w-full max-w-md p-6">
					<div className="h-9 w-48 animate-pulse rounded bg-muted" />
					<div className="mt-6 space-y-4">
						<div className="h-10 animate-pulse rounded-md bg-muted" />
						<div className="h-10 animate-pulse rounded-md bg-muted" />
						<div className="h-10 animate-pulse rounded-md bg-muted" />
					</div>
				</div>
			}
		>
			<LoginContent />
		</Suspense>
	);
}
