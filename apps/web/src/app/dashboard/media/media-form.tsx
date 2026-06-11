"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MediaFormData {
	name: string;
	description: string;
	website: string;
	logoUrl: string;
	country: string;
	selectedArtistIds: string[];
}

interface MediaFormProps {
	initialData?: Partial<MediaFormData> & {
		id?: string;
		artists?: { id: string; stageName: string }[];
	};
	mode: "create" | "edit";
	onSuccess?: () => void;
}

export function MediaForm({ initialData, mode, onSuccess }: MediaFormProps) {
	const router = useRouter();
	const id = useId();

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/dashboard/media");
				onSuccess?.();
			}}
			className="space-y-8"
		>
			{/* Basic Info */}
			<div className="space-y-4">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<FileText className="h-5 w-5 text-primary" />
					<span>Informations du Média (bientôt)</span>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${id}-name`}>
						Nom <span className="text-destructive">*</span>
					</Label>
					<Input
						id={`${id}-name`}
						value={initialData?.name ?? ""}
						onChange={() => {}}
						placeholder="Nom du média"
						disabled
					/>
					<p className="text-muted-foreground text-sm">
						Cette fonctionnalité arrive avec Epic 4.
					</p>
				</div>
			</div>
			{/* Submit */}
			<div className="flex gap-4 pt-4">
				<Button type="submit" className="min-w-[200px]">
					{mode === "create"
						? "Créer le média (bientôt)"
						: "Enregistrer (bientôt)"}
				</Button>
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Annuler
				</Button>
			</div>
		</form>
	);
}
