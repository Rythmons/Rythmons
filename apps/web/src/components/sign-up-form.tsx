import { useAuth, useSignUpForm } from "@rythmons/auth-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Loader from "./loader";
import { GoogleAuthButton } from "./social-auth-button";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();
	const authClient = useAuth();
	const { isPending } = authClient.useSession();

	const { form, isLoading: isSigningUp } = useSignUpForm({
		onSuccess: () => {
			router.push("/dashboard");
			toast.success("Inscription réussie");
		},
		onError: (error) => {
			toast.error(error);
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Créer un compte</h1>

			<GoogleAuthButton action="sign-up" />

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
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Nom</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-destructive text-sm">
										{String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>
				</div>

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
										{String(field.state.meta.errors[0])}
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
										{String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>
				</div>

				<Button type="submit" className="w-full" disabled={isSigningUp}>
					{isSigningUp ? "Envoi…" : "Inscription"}
				</Button>
			</form>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={onSwitchToSignIn}
					className="text-indigo-600 hover:text-indigo-800"
				>
					Vous avez déjà un compte ? Connectez-vous
				</Button>
			</div>
		</div>
	);
}
