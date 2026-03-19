"use client";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/reset-password-form";

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={null}>
			<ResetPasswordForm />
		</Suspense>
	);
}
