"use client";

import { useAuth } from "@rythmons/auth/client";
import {
	signUpRoleLabels,
	signUpRoleValues,
	type UserRole,
} from "@rythmons/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

interface User {
	name: string;
	email: string;
	image?: string | null;
	role?: UserRole | null;
}

export function ProfileForm({ user }: { user: User }) {
	const authClient = useAuth();
	const router = useRouter();
	const id = useId();
	const queryClient = useQueryClient();
	const [name, setName] = useState(user.name);
	const [role, setRole] = useState<UserRole | null>(user.role ?? null);
	const [isLoading, setIsLoading] = useState(false);
	const updateRoleMutation = useMutation(
		trpc.account.updateRole.mutationOptions(),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		const nameChanged = trimmedName !== user.name;
		const roleChanged = role !== (user.role ?? null);

		if (!nameChanged && !roleChanged) {
			toast.info("Aucune modification à enregistrer.");
			return;
		}

		if (trimmedName.length < 2) {
			toast.error("Le nom doit contenir au moins 2 caractères.");
			return;
		}

		setIsLoading(true);
		try {
			if (nameChanged) {
				await authClient.updateUser({
					name: trimmedName,
				});
			}

			if (roleChanged) {
				await updateRoleMutation.mutateAsync({
					role,
				});
			}

			await queryClient.invalidateQueries();
			router.refresh();
			toast.success("Profil mis à jour");
		} catch {
			toast.error("Erreur lors de la mise à jour");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor={`${id}-email`}>Email</Label>
				<Input id={`${id}-email`} value={user.email} disabled />
				<p className="text-muted-foreground text-sm">
					Votre email ne peut pas être modifié pour le moment.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor={`${id}-name`}>Nom</Label>
				<Input
					id={`${id}-name`}
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Votre nom"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor={`${id}-role`}>Type de compte</Label>
				<Select
					value={
						role && (role === "ARTIST" || role === "ORGANIZER") ? role : "NONE"
					}
					onValueChange={(value) =>
						setRole(value === "NONE" ? null : (value as UserRole))
					}
				>
					<SelectTrigger id={`${id}-role`}>
						<SelectValue placeholder="Choisir un type de compte" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="NONE">Je choisirai plus tard</SelectItem>
						{signUpRoleValues.map((roleValue) => (
							<SelectItem key={roleValue} value={roleValue}>
								{signUpRoleLabels[roleValue]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-muted-foreground text-sm">
					Les espaces Media / Radio et Prestataire restent en cours
					d'amélioration.
				</p>
			</div>

			<Button type="submit" disabled={isLoading}>
				{isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
			</Button>
		</form>
	);
}
