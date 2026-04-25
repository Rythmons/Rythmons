"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Globe, ImageIcon, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState as useReactState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";
import { UploadDropzone } from "@/utils/uploadthing";

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

	// Fetch all artists for multi-select
	const { data: availableArtists = [] } = useQuery(
		trpc.artist.myArtists.queryOptions(),
	);

	const [formData, setFormData] = useReactState<MediaFormData>({
		name: initialData?.name ?? "",
		description: initialData?.description ?? "",
		website: initialData?.website ?? "",
		logoUrl: initialData?.logoUrl ?? "",
		country: initialData?.country ?? "France",
		selectedArtistIds: initialData?.artists?.map((a) => a.id) ?? [],
	});

	const [isLoading, setIsLoading] = useReactState(false);
	const [errors, setErrors] = useReactState<
		Partial<Record<keyof MediaFormData, string>>
	>({});

	const createMutation = useMutation(trpc.media.create.mutationOptions());
	const updateMutation = useMutation(trpc.media.update.mutationOptions());

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof MediaFormData, string>> = {};
		if (!formData.name || formData.name.length < 2) {
			newErrors.name = "Le nom doit contenir au moins 2 caractères";
		}
		if (formData.website && !isValidUrl(formData.website)) {
			newErrors.website = "URL invalide";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const isValidUrl = (url: string): boolean => {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) {
			toast.error("Veuillez corriger les erreurs dans le formulaire");
			return;
		}
		setIsLoading(true);

		try {
			const submitData = {
				...formData,
				description: formData.description || null,
				website: formData.website || null,
				logoUrl: formData.logoUrl || null,
				artistIds: formData.selectedArtistIds,
			};

			if (mode === "create") {
				await createMutation.mutateAsync(submitData);
				toast.success("Média créé avec succès !");
			} else {
				if (!initialData?.id) throw new Error("ID manquant");
				await updateMutation.mutateAsync({
					id: initialData.id,
					data: submitData,
				});
				toast.success("Média mis à jour !");
			}

			router.refresh();
			onSuccess?.();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	};

	const updateField = <K extends keyof MediaFormData>(
		key: K,
		value: MediaFormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Basic Info */}
			<div className="space-y-4">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<FileText className="h-5 w-5 text-primary" />
					<span>Informations du Média</span>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${id}-name`}>
						Nom <span className="text-destructive">*</span>
					</Label>
					<Input
						id={`${id}-name`}
						value={formData.name}
						onChange={(e) => updateField("name", e.target.value)}
						placeholder="Nom du média"
						aria-invalid={!!errors.name}
					/>
					{errors.name && (
						<p className="text-destructive text-sm">{errors.name}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${id}-website`}>Site web</Label>
					<Input
						id={`${id}-website`}
						type="url"
						value={formData.website}
						onChange={(e) => updateField("website", e.target.value)}
						placeholder="https://..."
						aria-invalid={!!errors.website}
					/>
					{errors.website && (
						<p className="text-destructive text-sm">{errors.website}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${id}-description`}>Description</Label>
					<Textarea
						id={`${id}-description`}
						value={formData.description}
						onChange={(e) => updateField("description", e.target.value)}
						placeholder="Description du média..."
						rows={4}
					/>
				</div>

				<div className="space-y-2">
					<Label>Logo</Label>
					{formData.logoUrl ? (
						<div className="relative overflow-hidden rounded border">
							<img
								src={formData.logoUrl}
								alt="Logo"
								className="h-48 w-48 object-cover"
							/>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								className="absolute bottom-2 left-1/2 -translate-x-1/2"
								onClick={() => updateField("logoUrl", "")}
							>
								Changer
							</Button>
						</div>
					) : (
						<UploadDropzone
							endpoint="imageUploader"
							onClientUploadComplete={(res) => {
								if (res?.[0]) {
									updateField("logoUrl", res[0].url);
									toast.success("Logo téléchargé !");
								}
							}}
							onUploadError={(error: Error) => {
								toast.error(`Erreur: ${error.message}`);
							}}
							appearance={{
								container:
									"h-48 w-48 rounded border-dashed border-2 bg-muted/20",
								allowedContent: "hidden",
								label: "text-xs text-center px-2",
							}}
							content={{ label: "Logo (max 8MB)" }}
						/>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${id}-country`}>Pays</Label>
					<Input
						id={`${id}-country`}
						value={formData.country}
						onChange={(e) => updateField("country", e.target.value)}
					/>
				</div>
			</div>
			{/* Submit */}
			<div className="flex gap-4 pt-4">
				<Button type="submit" disabled={isLoading} className="min-w-[200px]">
					{isLoading
						? "Enregistrement..."
						: mode === "create"
							? "Créer le média"
							: "Enregistrer"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					disabled={isLoading}
				>
					Annuler
				</Button>
			</div>
		</form>
	);
}
