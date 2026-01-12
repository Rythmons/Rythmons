"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, FileText, Image, MapPin, Music, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState as useReactState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";

// Venue types with French labels
const VENUE_TYPES = [
	{ value: "BAR", label: "Bar" },
	{ value: "CLUB", label: "Club / Discothèque" },
	{ value: "CONCERT_HALL", label: "Salle de concert" },
	{ value: "FESTIVAL", label: "Festival" },
	{ value: "CAFE", label: "Café-concert" },
	{ value: "RESTAURANT", label: "Restaurant" },
	{ value: "CULTURAL_CENTER", label: "Centre culturel" },
	{ value: "THEATER", label: "Théâtre" },
	{ value: "OPEN_AIR", label: "Plein air" },
	{ value: "OTHER", label: "Autre" },
] as const;

type VenueType = (typeof VENUE_TYPES)[number]["value"];

interface VenueFormData {
	name: string;
	address: string;
	city: string;
	postalCode: string;
	country: string;
	venueType: VenueType;
	capacity: number | null;
	description: string;
	photoUrl: string;
	logoUrl: string;
	selectedGenres: string[];
}

interface VenueFormProps {
	initialData?: Partial<VenueFormData> & {
		id?: string;
		genres?: { id: string; name: string }[];
	};
	mode: "create" | "edit";
	onSuccess?: () => void;
}

export function VenueForm({ initialData, mode, onSuccess }: VenueFormProps) {
	const router = useRouter();
	const id = useId();

	// Fetch available genres
	const { data: availableGenres = [] } = useQuery(
		trpc.venue.getAllGenres.queryOptions(),
	);

	const [formData, setFormData] = useReactState<VenueFormData>({
		name: initialData?.name ?? "",
		address: initialData?.address ?? "",
		city: initialData?.city ?? "",
		postalCode: initialData?.postalCode ?? "",
		country: initialData?.country ?? "France",
		venueType: (initialData?.venueType as VenueType) ?? "BAR",
		capacity: initialData?.capacity ?? null,
		description: initialData?.description ?? "",
		photoUrl: initialData?.photoUrl ?? "",
		logoUrl: initialData?.logoUrl ?? "",
		selectedGenres: initialData?.genres?.map((g) => g.name) ?? [],
	});

	const [isLoading, setIsLoading] = useReactState(false);
	const [errors, setErrors] = useReactState<
		Partial<Record<keyof VenueFormData, string>>
	>({});

	const createMutation = useMutation(trpc.venue.create.mutationOptions());
	const updateMutation = useMutation(trpc.venue.update.mutationOptions());

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof VenueFormData, string>> = {};

		if (!formData.name || formData.name.length < 2) {
			newErrors.name = "Le nom doit contenir au moins 2 caractères";
		}
		if (!formData.address || formData.address.length < 5) {
			newErrors.address = "L'adresse est requise";
		}
		if (!formData.city || formData.city.length < 2) {
			newErrors.city = "La ville est requise";
		}
		if (!formData.postalCode || !/^\d{5}$/.test(formData.postalCode)) {
			newErrors.postalCode = "Code postal invalide (5 chiffres)";
		}
		if (formData.photoUrl && !isValidUrl(formData.photoUrl)) {
			newErrors.photoUrl = "URL invalide";
		}
		if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
			newErrors.logoUrl = "URL invalide";
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
			const { selectedGenres, ...restData } = formData;
			const submitData = {
				...restData,
				capacity: formData.capacity || null,
				description: formData.description || null,
				photoUrl: formData.photoUrl || null,
				logoUrl: formData.logoUrl || null,
				genreNames: selectedGenres,
			};

			if (mode === "create") {
				await createMutation.mutateAsync(submitData);
				toast.success("Lieu créé avec succès !");
			} else {
				if (!initialData?.id) throw new Error("ID manquant");
				await updateMutation.mutateAsync({
					id: initialData.id,
					data: submitData,
				});
				toast.success("Lieu mis à jour avec succès !");
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

	const updateField = <K extends keyof VenueFormData>(
		key: K,
		value: VenueFormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		// Clear error when user starts typing
		if (errors[key]) {
			setErrors((prev) => ({ ...prev, [key]: undefined }));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Basic Information */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<Building2 className="h-5 w-5 text-primary" />
					<span>Informations générales</span>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor={`${id}-name`}>
							Nom du lieu <span className="text-destructive">*</span>
						</Label>
						<Input
							id={`${id}-name`}
							value={formData.name}
							onChange={(e) => updateField("name", e.target.value)}
							placeholder="Ex: Le Petit Journal"
							aria-invalid={!!errors.name}
						/>
						{errors.name && (
							<p className="text-destructive text-sm">{errors.name}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${id}-type`}>
							Type de lieu <span className="text-destructive">*</span>
						</Label>
						<Select
							value={formData.venueType}
							onValueChange={(value) =>
								updateField("venueType", value as VenueType)
							}
						>
							<SelectTrigger id={`${id}-type`}>
								<SelectValue placeholder="Sélectionnez un type" />
							</SelectTrigger>
							<SelectContent>
								{VENUE_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* Address */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<MapPin className="h-5 w-5 text-primary" />
					<span>Adresse</span>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={`${id}-address`}>
							Adresse complète <span className="text-destructive">*</span>
						</Label>
						<Input
							id={`${id}-address`}
							value={formData.address}
							onChange={(e) => updateField("address", e.target.value)}
							placeholder="Ex: 123 Rue de la Musique"
							aria-invalid={!!errors.address}
						/>
						{errors.address && (
							<p className="text-destructive text-sm">{errors.address}</p>
						)}
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor={`${id}-city`}>
								Ville <span className="text-destructive">*</span>
							</Label>
							<Input
								id={`${id}-city`}
								value={formData.city}
								onChange={(e) => updateField("city", e.target.value)}
								placeholder="Ex: Paris"
								aria-invalid={!!errors.city}
							/>
							{errors.city && (
								<p className="text-destructive text-sm">{errors.city}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor={`${id}-postalCode`}>
								Code postal <span className="text-destructive">*</span>
							</Label>
							<Input
								id={`${id}-postalCode`}
								value={formData.postalCode}
								onChange={(e) => updateField("postalCode", e.target.value)}
								placeholder="Ex: 75001"
								maxLength={5}
								aria-invalid={!!errors.postalCode}
							/>
							{errors.postalCode && (
								<p className="text-destructive text-sm">{errors.postalCode}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor={`${id}-country`}>Pays</Label>
							<Input
								id={`${id}-country`}
								value={formData.country}
								onChange={(e) => updateField("country", e.target.value)}
								placeholder="France"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Capacity */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<Users className="h-5 w-5 text-primary" />
					<span>Capacité</span>
				</div>

				<div className="max-w-xs space-y-2">
					<Label htmlFor={`${id}-capacity`}>
						Capacité d'accueil (personnes)
					</Label>
					<Input
						id={`${id}-capacity`}
						type="number"
						min={0}
						value={formData.capacity ?? ""}
						onChange={(e) =>
							updateField(
								"capacity",
								e.target.value ? Number.parseInt(e.target.value, 10) : null,
							)
						}
						placeholder="Ex: 200"
					/>
					<p className="text-muted-foreground text-sm">
						Laissez vide si non applicable
					</p>
				</div>
			</div>

			{/* Music Genres */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<Music className="h-5 w-5 text-primary" />
					<span>Genres musicaux programmés</span>
				</div>

				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">
						Sélectionnez les genres musicaux que vous programmez habituellement
					</p>
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
						{availableGenres.map((genre) => (
							<div key={genre} className="flex items-center space-x-2">
								<Checkbox
									id={`${id}-genre-${genre}`}
									checked={formData.selectedGenres.includes(genre)}
									onCheckedChange={(checked) => {
										if (checked) {
											updateField("selectedGenres", [
												...formData.selectedGenres,
												genre,
											]);
										} else {
											updateField(
												"selectedGenres",
												formData.selectedGenres.filter((g) => g !== genre),
											);
										}
									}}
								/>
								<Label
									htmlFor={`${id}-genre-${genre}`}
									className="cursor-pointer font-normal text-sm"
								>
									{genre}
								</Label>
							</div>
						))}
					</div>
					{formData.selectedGenres.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-2">
							{formData.selectedGenres.map((genre) => (
								<span
									key={genre}
									className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm"
								>
									{genre}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Description */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<FileText className="h-5 w-5 text-primary" />
					<span>Description</span>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${id}-description`}>Description du lieu</Label>
					<Textarea
						id={`${id}-description`}
						value={formData.description}
						onChange={(e) => updateField("description", e.target.value)}
						placeholder="Décrivez votre lieu, son ambiance, son histoire..."
						rows={5}
					/>
					<p className="text-muted-foreground text-sm">
						Cette description sera visible sur votre profil public
					</p>
				</div>
			</div>

			{/* Images */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<Image className="h-5 w-5 text-primary" />
					<span>Visuels</span>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor={`${id}-photoUrl`}>URL de la photo principale</Label>
						<Input
							id={`${id}-photoUrl`}
							type="url"
							value={formData.photoUrl}
							onChange={(e) => updateField("photoUrl", e.target.value)}
							placeholder="https://..."
							aria-invalid={!!errors.photoUrl}
						/>
						{errors.photoUrl && (
							<p className="text-destructive text-sm">{errors.photoUrl}</p>
						)}
						<p className="text-muted-foreground text-sm">
							Photo principale de votre établissement
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${id}-logoUrl`}>URL du logo</Label>
						<Input
							id={`${id}-logoUrl`}
							type="url"
							value={formData.logoUrl}
							onChange={(e) => updateField("logoUrl", e.target.value)}
							placeholder="https://..."
							aria-invalid={!!errors.logoUrl}
						/>
						{errors.logoUrl && (
							<p className="text-destructive text-sm">{errors.logoUrl}</p>
						)}
						<p className="text-muted-foreground text-sm">
							Logo ou image de marque
						</p>
					</div>
				</div>

				{/* Image Preview */}
				{(formData.photoUrl || formData.logoUrl) && (
					<div className="flex gap-4">
						{formData.photoUrl && isValidUrl(formData.photoUrl) && (
							<div className="space-y-2">
								<p className="font-medium text-sm">Aperçu photo</p>
								<img
									src={formData.photoUrl}
									alt="Aperçu"
									className="h-32 w-48 rounded-lg object-cover shadow-sm"
								/>
							</div>
						)}
						{formData.logoUrl && isValidUrl(formData.logoUrl) && (
							<div className="space-y-2">
								<p className="font-medium text-sm">Aperçu logo</p>
								<img
									src={formData.logoUrl}
									alt="Logo"
									className="h-32 w-32 rounded-lg object-contain shadow-sm"
								/>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Submit Button */}
			<div className="flex gap-4 pt-4">
				<Button type="submit" disabled={isLoading} className="min-w-[200px]">
					{isLoading
						? "Enregistrement..."
						: mode === "create"
							? "Créer mon lieu"
							: "Enregistrer les modifications"}
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
