"use client";

import { useAuth } from "@rythmons/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DevVerificationLinkResponse = {
	preview: {
		url: string;
		createdAt: string;
	} | null;
};

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const authClient = useAuth();
	const { data: session } = authClient.useSession();
	const [isSending, setIsSending] = useState(false);
	const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(
		null,
	);
	const targetEmail = session?.user?.email ?? searchParams.get("email");

	const loadDevVerificationLink = useCallback(async () => {
		if (process.env.NODE_ENV === "production" || !targetEmail) {
			setDevVerificationUrl(null);
			return;
		}

		try {
			const response = await fetch(
				`/api/dev/verification-link?email=${encodeURIComponent(targetEmail)}`,
				{
					cache: "no-store",
				},
			);

			if (!response.ok) {
				setDevVerificationUrl(null);
				return;
			}

			const data = (await response.json()) as DevVerificationLinkResponse;
			setDevVerificationUrl(data.preview?.url ?? null);
		} catch {
			setDevVerificationUrl(null);
		}
	}, [targetEmail]);

	useEffect(() => {
		void loadDevVerificationLink();
	}, [loadDevVerificationLink]);

	const handleResend = async () => {
		if (!targetEmail) {
			toast.error("Aucun e-mail associé à cette session.");
			return;
		}
		setIsSending(true);
		try {
			await authClient.sendVerificationEmail({
				email: targetEmail,
				callbackURL: "/dashboard",
			});
			await loadDevVerificationLink();
			toast.success("E-mail de vérification renvoyé !");
		} catch {
			toast.error("Échec de l'envoi. Réessayez plus tard.");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<title>E-mail</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>

				<h1 className="font-bold text-2xl">Vérifiez votre adresse e-mail</h1>

				<p className="text-muted-foreground">
					Un e-mail de vérification a été envoyé à votre adresse. Cliquez sur le
					lien dans l'e-mail pour activer votre compte.
				</p>

				<div className="space-y-3">
					<Button
						onClick={handleResend}
						disabled={isSending}
						variant="outline"
						className="w-full"
					>
						{isSending
							? "Envoi en cours…"
							: "Renvoyer l'e-mail de vérification"}
					</Button>

					{devVerificationUrl ? (
						<Button
							type="button"
							variant="secondary"
							className="w-full"
							onClick={() => window.location.assign(devVerificationUrl)}
						>
							Ouvrir le lien de vérification (mode dev)
						</Button>
					) : null}

					<Button
						variant="link"
						onClick={() => router.push("/login")}
						className="w-full text-indigo-600 hover:text-indigo-800"
					>
						Retour à la connexion
					</Button>
				</div>

				<p className="text-muted-foreground text-xs">
					Si vous ne trouvez pas l'e-mail, vérifiez votre dossier de spam.
				</p>

				{devVerificationUrl ? (
					<p className="text-muted-foreground text-xs">
						En développement, ce bouton remplace l'ouverture d'un vrai e-mail
						pour tester le parcours complet.
					</p>
				) : null}
			</div>
		</div>
	);
}

function VerifyEmailFallback() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
					<div className="h-8 w-8 animate-pulse rounded bg-indigo-300 dark:bg-indigo-600" />
				</div>
				<h1 className="font-bold text-2xl">Vérifiez votre adresse e-mail</h1>
				<p className="text-muted-foreground">Chargement…</p>
			</div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<VerifyEmailFallback />}>
			<VerifyEmailContent />
		</Suspense>
	);
}
