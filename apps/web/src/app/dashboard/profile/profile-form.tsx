"use client";

import { useAuth } from "@rythmons/auth/client";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner"; // Assuming sonner is set up as seen in file list
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
	name: string;
	email: string;
	image?: string | null;
}

export function ProfileForm({ user }: { user: User }) {
	const authClient = useAuth(); // Need to re-import useAuth
	const router = useRouter(); // Need to import useRouter
	const id = useId();
	const [name, setName] = useState(user.name);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await authClient.updateUser({
				name,
			});
			router.refresh(); // Refresh the current route to update server components
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

			<Button type="submit" disabled={isLoading}>
				{isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
			</Button>
		</form>
	);
}
