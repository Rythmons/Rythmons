import { useAuth, useSignUpForm } from "@rythmons/auth/client";
import { signUpRoleLabels, signUpSchema } from "@rythmons/validation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Loader from "./loader";
import { GoogleAuthButton } from "./social-auth-button";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
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
	const [emailValue, setEmailValue] = useState("");
	const [passwordValue, setPasswordValue] = useState("");
	const [passwordConfirmationValue, setPasswordConfirmationValue] =
		useState("");

	const { form, isLoading: isSigningUp } = useSignUpForm({
		onSuccess: () => {
			const verifyEmailHref = emailValue
				? `/verify-email?email=${encodeURIComponent(emailValue)}`
				: "/verify-email";
			router.push(verifyEmailHref as never);
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
					<span className="bg-background px-2">Ou continuer avec l'e-mail</span>
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
									onChange={(e) => {
										const nextValue = e.target.value;
										setEmailValue(nextValue);
										field.handleChange(nextValue);
									}}
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
					<form.Field name="role">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Type de compte</Label>
								<select
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value as "ARTIST" | "ORGANIZER")
									}
									className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									{(
										Object.entries(signUpRoleLabels) as [
											keyof typeof signUpRoleLabels,
											string,
										][]
									).map(([value, label]) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</select>
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
									onChange={(e) => {
										const nextValue = e.target.value;
										setPasswordValue(nextValue);
										field.handleChange(nextValue);
									}}
								/>
								{field.state.meta.errors.length > 0 && (
									<div className="space-y-1">
										{field.state.meta.errors.map((error) => {
											const errorMessage =
												typeof error === "object"
													? (error as { message: string }).message
													: String(error);
											return (
												<p
													key={errorMessage}
													className="text-destructive text-sm"
												>
													{errorMessage}
												</p>
											);
										})}
									</div>
								)}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="passwordConfirmation">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Confirmation du mot de passe</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const nextValue = e.target.value;
										setPasswordConfirmationValue(nextValue);
										field.handleChange(nextValue);
									}}
								/>
								{(() => {
									const mismatchError =
										passwordConfirmationValue.length > 0 &&
										passwordValue !== passwordConfirmationValue
											? "Les mots de passe ne correspondent pas"
											: null;
									const fieldError =
										mismatchError ||
										(field.state.meta.errors.length > 0
											? typeof field.state.meta.errors[0] === "object"
												? (
														field.state.meta.errors[0] as {
															message: string;
														}
													).message
												: String(field.state.meta.errors[0])
											: null);

									return fieldError ? (
										<p className="text-destructive text-sm">{fieldError}</p>
									) : null;
								})()}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="acceptedTerms">
						{(field) => (
							<div className="space-y-2">
								<div className="flex items-start gap-2">
									<Checkbox
										id="acceptedTerms"
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked === true)
										}
									/>
									<Label
										htmlFor="acceptedTerms"
										className="cursor-pointer font-normal text-sm leading-tight"
									>
										J'accepte les{" "}
										<a
											href="/cgu"
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary underline hover:opacity-80"
										>
											conditions générales d'utilisation
										</a>
									</Label>
								</div>
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

				<form.Subscribe>
					{(state) => {
						const canSubmit = signUpSchema.safeParse(state.values).success;

						return (
							<Button
								type="submit"
								className="w-full"
								disabled={!canSubmit || isSigningUp || state.isSubmitting}
							>
								{isSigningUp || state.isSubmitting ? "Envoi…" : "Inscription"}
							</Button>
						);
					}}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button variant="link" onClick={onSwitchToSignIn}>
					Vous avez déjà un compte ? Connectez-vous
				</Button>
			</div>
		</div>
	);
}
