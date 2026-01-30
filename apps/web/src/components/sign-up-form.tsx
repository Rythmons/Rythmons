import { useAuth, useSignUpForm } from "@rythmons/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Loader from "./loader";
import { GoogleAuthButton } from "./social-auth-button";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

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
					<form.Field name="role">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Je suis un(e)</Label>
								<Select
									onValueChange={(value) =>
										field.handleChange(
											value as
												| "ARTIST"
												| "ORGANIZER"
												| "MEDIA"
												| "TECH_SERVICE",
										)
									}
									defaultValue={field.state.value}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder="Sélectionnez votre rôle" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ARTIST">Artiste / Groupe</SelectItem>
										<SelectItem value="ORGANIZER">
											Organisateur / Lieu
										</SelectItem>
										<SelectItem value="MEDIA">Média / Radio / Blog</SelectItem>
										<SelectItem value="TECH_SERVICE">
											Prestataire (Son, Lumière, Matériel...)
										</SelectItem>
									</SelectContent>
								</Select>
								{field.state.meta.errors.length > 0 && (
									<p className="text-destructive text-sm">
										{(field.state.meta.errors[0] as any)?.message ||
											String(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<form.Field name="firstName">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Prénom</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-xs">
											{(field.state.meta.errors[0] as any)?.message ||
												String(field.state.meta.errors[0])}
										</p>
									)}
							</div>
						)}
					</form.Field>
					<form.Field name="lastName">
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
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-xs">
											{(field.state.meta.errors[0] as any)?.message ||
												String(field.state.meta.errors[0])}
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
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-xs">
											{(field.state.meta.errors[0] as any)?.message ||
												String(field.state.meta.errors[0])}
										</p>
									)}
							</div>
						)}
					</form.Field>
				</div>

				<div className="grid grid-cols-2 gap-4">
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
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-xs">
											{(field.state.meta.errors[0] as any)?.message ||
												String(field.state.meta.errors[0])}
										</p>
									)}
							</div>
						)}
					</form.Field>
					<form.Field name="confirmPassword">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Confirmation</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-destructive text-xs">
											{(field.state.meta.errors[0] as any)?.message ||
												String(field.state.meta.errors[0])}
										</p>
									)}
							</div>
						)}
					</form.Field>
				</div>

				<form.Field name="acceptTerms">
					{(field) => (
						<div className="flex flex-col space-y-2">
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id={field.name}
									checked={field.state.value as boolean}
									onChange={(e) => field.handleChange(e.target.checked)}
									className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
								/>
								<Label htmlFor={field.name} className="font-normal text-sm">
									J'accepte les{" "}
									<Link
										href={"/terms" as any}
										className="text-indigo-600 hover:underline"
									>
										Conditions Générales d'Utilisation
									</Link>
								</Label>
							</div>
							{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 && (
									<p className="text-destructive text-xs">
										{(field.state.meta.errors[0] as any)?.message ||
											String(field.state.meta.errors[0])}
									</p>
								)}
						</div>
					)}
				</form.Field>

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
