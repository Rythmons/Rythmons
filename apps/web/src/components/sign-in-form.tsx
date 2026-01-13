import { useAuth, useSignInForm } from "@rythmons/auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import Loader from "./loader";
import { GoogleAuthButton } from "./social-auth-button";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const authClient = useAuth();
	const { isPending, data: session } = authClient.useSession();

	useEffect(() => {
		if (session?.user) {
			router.replace("/dashboard");
		}
	}, [session?.user, router]);

	const { form, isLoading: isSigningIn } = useSignInForm({
		onSuccess: async () => {
			toast.success("Connexion réussie");
			// Wait for session to be set before redirecting
			await new Promise((resolve) => setTimeout(resolve, 500));
			router.push("/dashboard");
			router.refresh();
		},
		onError: (error) => {
			toast.error(error);
		},
	});

	// If user is already logged in, redirect to dashboard
	if (session?.user) {
		return <Loader />;
	}

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Bon retour</h1>

			<GoogleAuthButton action="sign-in" />

			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-border border-t" />
				</div>
				<div className="relative flex justify-center text-muted-foreground text-xs uppercase">
					<span className="bg-background px-2">Ou continuer avec l’e-mail</span>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>E-mail</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-destructive text-sm">
										{typeof field.state.meta.errors[0] === "object"
											? (field.state.meta.errors[0] as { message: string })
													.message
											: String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Mot de passe</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-destructive text-sm">
										{typeof field.state.meta.errors[0] === "object"
											? (field.state.meta.errors[0] as { message: string })
													.message
											: String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>
				</div>

				<Button type="submit" className="w-full" disabled={isSigningIn}>
					{isSigningIn ? "Envoi…" : "Se connecter"}
				</Button>
			</form>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={onSwitchToSignUp}
					className="text-indigo-600 hover:text-indigo-800"
				>
					Besoin d’un compte ? Inscrivez-vous
				</Button>
			</div>
		</div>
	);
}
