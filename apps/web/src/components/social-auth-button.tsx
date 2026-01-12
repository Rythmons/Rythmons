"use client";

import { useAuth } from "@rythmons/auth-react";
import { Loader2 } from "lucide-react";
import { type SVGProps, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

type SocialAuthButtonProps = {
	action: "sign-in" | "sign-up";
};

export function GoogleAuthButton({ action }: SocialAuthButtonProps) {
	const authClient = useAuth();
	const [isLoading, setIsLoading] = useState(false);

	const label =
		action === "sign-in"
			? "Se connecter avec Google"
			: "S’inscrire avec Google";

	const handleGoogleAuth = async () => {
		setIsLoading(true);
		try {
			await authClient.signIn.social(
				{
					provider: "google",
					callbackURL: "/dashboard",
				},
				{
					onError: (error) => {
						const message =
							error.error?.message ||
							error.error?.statusText ||
							"Nous n’avons pas pu nous connecter à Google. Merci de réessayer.";
						toast.error(message);
						setIsLoading(false);
					},
					onFinished: () => {
						setIsLoading(false);
					},
				},
			);
		} catch (_error) {
			toast.error(
				"La connexion à Google a échoué. Vérifiez votre connexion internet ou réessayez dans quelques instants.",
			);
			setIsLoading(false);
		}
	};

	return (
		<Button
			type="button"
			variant="outline"
			onClick={handleGoogleAuth}
			disabled={isLoading}
			className="w-full"
		>
			{isLoading ? (
				<Loader2 className="size-4 animate-spin" aria-hidden="true" />
			) : (
				<GoogleIcon className="size-4" aria-hidden="true" />
			)}
			<span className="font-medium">{isLoading ? "Redirection…" : label}</span>
		</Button>
	);
}

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" role="img" {...props}>
			<title>Google</title>
			<path
				fill="#4285F4"
				d="M23.766 12.276c0-.815-.074-1.596-.211-2.353H12v4.45h6.623c-.286 1.545-1.157 2.85-2.461 3.724v3.093h3.977c2.33-2.144 3.627-5.3 3.627-8.914z"
			/>
			<path
				fill="#34A853"
				d="M12 24c3.24 0 5.962-1.073 7.95-2.915l-3.977-3.093c-1.107.744-2.523 1.19-3.973 1.19-3.05 0-5.63-2.062-6.555-4.828H1.324v3.127C3.305 21.091 7.341 24 12 24z"
			/>
			<path
				fill="#FBBC05"
				d="M5.445 14.354c-.25-.744-.392-1.54-.392-2.354s.142-1.61.392-2.354V6.519H1.324C.48 8.091 0 9.978 0 12s.48 3.909 1.324 5.481l4.121-3.127z"
			/>
			<path
				fill="#EA4335"
				d="M12 4.74c1.763 0 3.347.607 4.59 1.798l3.433-3.433C17.958 1.261 15.236 0 12 0 7.341 0 3.305 2.909 1.324 6.519l4.121 3.127C6.37 6.802 8.95 4.74 12 4.74z"
			/>
		</svg>
	);
}
