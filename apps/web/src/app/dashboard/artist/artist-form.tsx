"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Euro, FileText, Globe, Mic2, Music, Sparkles } from "lucide-react";
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

interface ArtistFormData {
	stageName: string;
	photoUrl: string;
	bio: string;
	website: string;
	techRequirements: string;
	feeMin: number | null;
	feeMax: number | null;
	selectedGenres: string[];
}

interface ArtistFormProps {
	initialData?: Partial<ArtistFormData> & {
		id?: string;
		genres?: { id: string; name: string }[];
	};
	mode: "create" | "edit";
	onSuccess?: () => void;
}

export function ArtistForm({ initialData, mode, onSuccess }: ArtistFormProps) {
	const router = useRouter();
	const id = useId();

	// Fetch available genres (reusing venue endpoint for now as genres are shared ideally)
	const { data: availableGenres = [] } = useQuery(
		trpc.venue.getAllGenres.queryOptions(),
	);

	const [formData, setFormData] = useReactState<ArtistFormData>({
		stageName: initialData?.stageName ?? "",
		photoUrl: initialData?.photoUrl ?? "",
		bio: initialData?.bio ?? "",
		website: initialData?.website ?? "",
		techRequirements: initialData?.techRequirements ?? "",
		feeMin: initialData?.feeMin ?? null,
		feeMax: initialData?.feeMax ?? null,
		selectedGenres: initialData?.genres?.map((g) => g.name) ?? [],
	});

	const [isLoading, setIsLoading] = useReactState(false);
	const [errors, setErrors] = useReactState<
		Partial<Record<keyof ArtistFormData, string>>
	>({});

	const createMutation = useMutation(trpc.artist.create.mutationOptions());

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof ArtistFormData, string>> = {};

		if (!formData.stageName || formData.stageName.length < 2) {
			newErrors.stageName =
				"Le nom de scène doit contenir au moins 2 caractères";
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
			const { selectedGenres, ...restData } = formData;
			const submitData = {
				...restData,
				feeMin: formData.feeMin || undefined,
				feeMax: formData.feeMax || undefined,
				bio: formData.bio || undefined,
				website: formData.website || undefined,
				techRequirements: formData.techRequirements || undefined,
				photoUrl: formData.photoUrl || undefined,
				genres: selectedGenres,
			};

			if (mode === "create") {
				await createMutation.mutateAsync(submitData);
				toast.success("Profil artiste créé avec succès !");
			} else {
				toast.info("Mise à jour non implémentée pour le moment");
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

	const updateField = <K extends keyof ArtistFormData>(
		key: K,
		value: ArtistFormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) {
			setErrors((prev) => ({ ...prev, [key]: undefined }));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Basic Information */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<Mic2 className="h-5 w-5 text-primary" />
					<span>Identité Artistique</span>
				</div>

				<div className="space-y-4">
					<div className="grid gap-6 md:grid-cols-[200px_1fr]">
						{/* Photo Upload */}
						<div className="space-y-2">
							<Label>Photo de profil</Label>
							{formData.photoUrl ? (
								<div className="relative overflow-hidden rounded-full border">
									<img
										src={formData.photoUrl}
										alt="Profil"
										className="h-48 w-48 object-cover"
									/>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										className="absolute bottom-2 left-1/2 -translate-x-1/2 shadow-sm"
										onClick={() => updateField("photoUrl", "")}
									>
										Changer
									</Button>
								</div>
							) : (
								<UploadDropzone
									endpoint="imageUploader"
									onClientUploadComplete={(res) => {
										if (res?.[0]) {
											updateField("photoUrl", res[0].url);
											toast.success("Photo téléchargée !");
										}
									}}
									onUploadError={(error: Error) => {
										toast.error(`Erreur: ${error.message}`);
									}}
									appearance={{
										container:
											"h-48 w-48 rounded-full border-dashed border-2 bg-muted/20 mx-0",
										allowedContent: "hidden",
										label: "text-xs text-center px-2",
									}}
									content={{
										label: "Photo (max 8MB)",
									}}
								/>
							)}
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={`${id}-stageName`}>
									Nom de scène / Groupe{" "}
									<span className="text-destructive">*</span>
								</Label>
								<Input
									id={`${id}-stageName`}
									value={formData.stageName}
									onChange={(e) => updateField("stageName", e.target.value)}
									placeholder="Ex: The Rolling Stones"
									aria-invalid={!!errors.stageName}
								/>
								{errors.stageName && (
									<p className="text-destructive text-sm">{errors.stageName}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${id}-website`}>
									Site web / YouTube / Bandcamp
								</Label>
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
						</div>
					</div>
				</div>
			</div>

			{/* Genres */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<Music className="h-5 w-5 text-primary" />
					<span>Genres musicaux</span>
				</div>

				<div className="space-y-4">
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
				</div>
			</div>

			{/* Bio & Details */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<FileText className="h-5 w-5 text-primary" />
					<span>Présentation</span>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${id}-bio`}>Biographie courte</Label>
					<Textarea
						id={`${id}-bio`}
						value={formData.bio}
						onChange={(e) => updateField("bio", e.target.value)}
						placeholder="Racontez votre histoire..."
						rows={4}
					/>
				</div>
			</div>

			{/* Technical & Fees */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 font-semibold text-lg">
					<Sparkles className="h-5 w-5 text-primary" />
					<span>Technique & Tarifs</span>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={`${id}-tech`}>
							Besoins techniques (fiche technique simplifiée)
						</Label>
						<Textarea
							id={`${id}-tech`}
							value={formData.techRequirements}
							onChange={(e) => updateField("techRequirements", e.target.value)}
							placeholder="Ex: 2 micros, 1 ampli basse, batterie fournie..."
							rows={3}
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor={`${id}-feeMin`}>Cachet minimum (€)</Label>
							<div className="relative">
								<Euro className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									id={`${id}-feeMin`}
									type="number"
									min={0}
									className="pl-9"
									value={formData.feeMin ?? ""}
									onChange={(e) =>
										updateField(
											"feeMin",
											e.target.value
												? Number.parseInt(e.target.value, 10)
												: null,
										)
									}
									placeholder="0"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${id}-feeMax`}>Cachet souhaité (€)</Label>
							<div className="relative">
								<Euro className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									id={`${id}-feeMax`}
									type="number"
									min={0}
									className="pl-9"
									value={formData.feeMax ?? ""}
									onChange={(e) =>
										updateField(
											"feeMax",
											e.target.value
												? Number.parseInt(e.target.value, 10)
												: null,
										)
									}
									placeholder="0"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Submit Button */}
			<div className="flex gap-4 pt-4">
				<Button type="submit" disabled={isLoading} className="min-w-[200px]">
					{isLoading
						? "Enregistrement..."
						: mode === "create"
							? "Créer mon profil"
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
