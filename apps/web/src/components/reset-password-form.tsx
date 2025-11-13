import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";
import { GoogleAuthButton } from "./social-auth-button";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm() {
	const router = useRouter();
	const { isPending, data: session } = authClient.useSession();

	useEffect(() => {
		if (session?.user) {
			router.replace("/dashboard");
		}
	}, [session?.user, router]);

	const form = useForm({
		defaultValues: {
			password: "",
			passwordConfirm: "",
		},
		onSubmit: async ({ value }) => {
			if (value.password !== value.passwordConfirm) {
				toast.error("Les mots de passe ne correspondent pas");
				return;
			}
			// Get token from URL
			const urlParams = new URLSearchParams(window.location.search);
			const token = urlParams.get("token");

			await authClient.resetPassword(
				{
					token: token ?? undefined,
					newPassword: value.password,
				},
				{
					onSuccess: () => {
						toast.success("Mot de passe réinitialisé avec succès");
						router.push("/login");
					},
					onError: (error) => {
						toast.error(
							error.error.message || "Erreur lors de la réinitialisation",
						);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				password: z
					.string()
					.min(8, "Le mot de passe doit contenir au moins 8 caractères"),
				passwordConfirm: z
					.string()
					.min(8, "Le mot de passe doit contenir au moins 8 caractères"),
			}),
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
			<h1 className="mb-6 text-center font-bold text-3xl">
				Changement de mot de passe
			</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Nouveau mot de passe</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
					<form.Field name="passwordConfirm">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>
									Confirmer le nouveau mot de passe
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? "Envoi…" : "Modifier le mot de passe"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
