"use client";

import { type ArtistSocialLinks, MUSIC_GENRES } from "@rythmons/validation";
import { useMutation } from "@tanstack/react-query";
import {
	Euro,
	ExternalLink,
	FileText,
	Headphones,
	Image as ImageIcon,
	MapPin,
	Mic2,
	Music,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState as useReactState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormDraft } from "@/hooks/use-form-draft";
import { trpc } from "@/utils/trpc";
import { UploadDropzone } from "@/utils/uploadthing";

interface ArtistFormData {
	stageName: string;
	city: string;
	postalCode: string;
	photoUrl: string;
	bannerUrl: string;
	bio: string;
	website: string;
	socialLinks: ArtistSocialLinks;
	techRequirements: string;
	feeMin: number | null;
	feeMax: number | null;
	isNegotiable: boolean;
	selectedGenres: string[];
	images: string[];
}

interface ArtistFormProps {
	initialData?: Omit<Partial<ArtistFormData>, "socialLinks"> & {
		id?: string;
		genres?: { id: string; name: string }[];
		socialLinks?: Record<string, string> | null;
	};
	mode: "create" | "edit";
	onSuccess?: (artistId?: string) => void;
}

export function ArtistForm({ initialData, mode, onSuccess }: ArtistFormProps) {
	const router = useRouter();
	const id = useId();

	const parsedSocialLinks: ArtistSocialLinks = {
		spotify:
			(initialData?.socialLinks as Record<string, string>)?.spotify ?? "",
		youtube:
			(initialData?.socialLinks as Record<string, string>)?.youtube ?? "",
		soundcloud:
			(initialData?.socialLinks as Record<string, string>)?.soundcloud ?? "",
		bandcamp:
			(initialData?.socialLinks as Record<string, string>)?.bandcamp ?? "",
		deezer: (initialData?.socialLinks as Record<string, string>)?.deezer ?? "",
		appleMusic:
			(initialData?.socialLinks as Record<string, string>)?.appleMusic ?? "",
	};

	const [formData, setFormData] = useReactState<ArtistFormData>({
		stageName: initialData?.stageName ?? "",
		city: initialData?.city ?? "",
		postalCode: initialData?.postalCode ?? "",
		photoUrl: initialData?.photoUrl ?? "",
		bannerUrl: initialData?.bannerUrl ?? "",
		bio: initialData?.bio ?? "",
		website: initialData?.website ?? "",
		socialLinks: parsedSocialLinks,
		techRequirements: initialData?.techRequirements ?? "",
		feeMin: initialData?.feeMin ?? null,
		feeMax: initialData?.feeMax ?? null,
		isNegotiable: initialData?.isNegotiable ?? false,
		selectedGenres: initialData?.genres?.map((g) => g.name) ?? [],
		images: initialData?.images ?? [],
	});

	const [isLoading, setIsLoading] = useReactState(false);
	const [errors, setErrors] = useReactState<
		Partial<Record<keyof ArtistFormData, string>>
	>({});

	const DRAFT_KEY = "rythmons:web:draft:artist-create";
	const { draft, saveDraft, clearDraft, hasDraft } =
		useFormDraft<ArtistFormData>(DRAFT_KEY, { throttleMs: 2000 });

	useEffect(() => {
		if (mode === "create") {
			saveDraft(formData);
		}
	}, [mode, formData, saveDraft]);

	const createMutation = useMutation(trpc.artist.create.mutationOptions());
	const updateMutation = useMutation(trpc.artist.update.mutationOptions());

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof ArtistFormData, string>> = {};

		if (!formData.stageName || formData.stageName.length < 2) {
			newErrors.stageName =
				"Le nom de scène doit contenir au moins 2 caractères";
		}
		if (formData.website && !isValidUrl(formData.website)) {
			newErrors.website = "URL invalide";
		}
		for (const value of Object.values(formData.socialLinks)) {
			if (value && !isValidUrl(value)) {
				newErrors.socialLinks =
					"Tous les liens musique doivent être des URLs valides";
				break;
			}
		}
		if (
			formData.feeMin !== null &&
			formData.feeMax !== null &&
			formData.feeMax < formData.feeMin
		) {
			newErrors.feeMax = "Le cachet max doit être supérieur ou égal au minimum";
		}
		if (
			formData.postalCode.trim() !== "" &&
			!/^\d{5}$/.test(formData.postalCode.trim())
		) {
			newErrors.postalCode = "Le code postal doit contenir 5 chiffres";
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
			const normalizedSocialLinks = Object.fromEntries(
				Object.entries(formData.socialLinks).map(([key, value]) => [
					key,
					value.trim(),
				]),
			) as ArtistSocialLinks;
			const submitData = {
				...restData,
				city: formData.city.trim() || null,
				postalCode: formData.postalCode.trim()
					? formData.postalCode.trim()
					: null,
				feeMin: formData.feeMin ?? null,
				feeMax: formData.feeMax ?? null,
				isNegotiable: formData.isNegotiable,
				bio: formData.bio || null,
				website: formData.website || null,
				socialLinks: normalizedSocialLinks,
				techRequirements: formData.techRequirements || null,
				photoUrl: formData.photoUrl || null,
				bannerUrl: formData.bannerUrl || null,
				genreNames: selectedGenres,
				images: formData.images,
			};

			if (mode === "create") {
				const createdArtist = await createMutation.mutateAsync(submitData);
				clearDraft();
				toast.success("Profil artiste créé avec succès !");
				onSuccess?.(createdArtist.id);
			} else {
				if (!initialData?.id) throw new Error("ID manquant");
				await updateMutation.mutateAsync({
					id: initialData.id,
					data: submitData,
				});
				toast.success("Profil artiste mis à jour !");
				onSuccess?.(initialData.id);
			}

			router.refresh();
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
			{mode === "create" && hasDraft && draft && (
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
					<p className="text-muted-foreground text-sm">
						Un brouillon est disponible.
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								setFormData(draft);
								clearDraft();
								toast.success("Brouillon restauré");
							}}
						>
							Restaurer
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => {
								clearDraft();
								toast.success("Brouillon ignoré");
							}}
						>
							Ignorer
						</Button>
					</div>
				</div>
			)}
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
									{/* biome-ignore lint/performance/noImgElement: existing upload preview uses direct remote URL */}
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
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor={`${id}-website`}>Site web</Label>
										<Input
											id={`${id}-website`}
											type="url"
											value={formData.website}
											onChange={(e) => updateField("website", e.target.value)}
											placeholder="https://monsite.com"
											aria-invalid={!!errors.website}
										/>
										{errors.website && (
											<p className="text-destructive text-sm">
												{errors.website}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Localisation */}
					<div className="space-y-6">
						<div className="flex items-center gap-2 font-semibold text-lg">
							<MapPin className="h-5 w-5 text-primary" />
							<span>Localisation</span>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`${id}-city`}>Ville</Label>
								<Input
									id={`${id}-city`}
									value={formData.city}
									onChange={(e) => updateField("city", e.target.value)}
									placeholder="Ex: Paris"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`${id}-postalCode`}>Code postal</Label>
								<Input
									id={`${id}-postalCode`}
									value={formData.postalCode}
									onChange={(e) =>
										updateField(
											"postalCode",
											e.target.value.replace(/\D/g, "").slice(0, 5),
										)
									}
									placeholder="75001"
									maxLength={5}
									aria-invalid={!!errors.postalCode}
								/>
								{errors.postalCode && (
									<p className="text-destructive text-sm">
										{errors.postalCode}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Music Links */}
					<div className="space-y-6">
						<div className="flex items-center gap-2 font-semibold text-lg">
							<Headphones className="h-5 w-5 text-primary" />
							<span>Liens musique</span>
						</div>
						<p className="text-muted-foreground text-sm">
							Ajoutez vos liens de streaming pour que les organisateurs puissent
							écouter votre musique
						</p>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`${id}-spotify`}>Spotify</Label>
								<div className="relative">
									<ExternalLink className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id={`${id}-spotify`}
										type="url"
										className="pl-9"
										value={formData.socialLinks.spotify}
										onChange={(e) =>
											updateField("socialLinks", {
												...formData.socialLinks,
												spotify: e.target.value,
											})
										}
										placeholder="https://open.spotify.com/artist/..."
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${id}-youtube`}>YouTube</Label>
								<div className="relative">
									<ExternalLink className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id={`${id}-youtube`}
										type="url"
										className="pl-9"
										value={formData.socialLinks.youtube}
										onChange={(e) =>
											updateField("socialLinks", {
												...formData.socialLinks,
												youtube: e.target.value,
											})
										}
										placeholder="https://youtube.com/@..."
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${id}-soundcloud`}>SoundCloud</Label>
								<div className="relative">
									<ExternalLink className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id={`${id}-soundcloud`}
										type="url"
										className="pl-9"
										value={formData.socialLinks.soundcloud}
										onChange={(e) =>
											updateField("socialLinks", {
												...formData.socialLinks,
												soundcloud: e.target.value,
											})
										}
										placeholder="https://soundcloud.com/..."
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${id}-bandcamp`}>Bandcamp</Label>
								<div className="relative">
									<ExternalLink className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id={`${id}-bandcamp`}
										type="url"
										className="pl-9"
										value={formData.socialLinks.bandcamp}
										onChange={(e) =>
											updateField("socialLinks", {
												...formData.socialLinks,
												bandcamp: e.target.value,
											})
										}
										placeholder="https://....bandcamp.com"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${id}-deezer`}>Deezer</Label>
								<div className="relative">
									<ExternalLink className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id={`${id}-deezer`}
										type="url"
										className="pl-9"
										value={formData.socialLinks.deezer}
										onChange={(e) =>
											updateField("socialLinks", {
												...formData.socialLinks,
												deezer: e.target.value,
											})
										}
										placeholder="https://www.deezer.com/artist/..."
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${id}-appleMusic`}>Apple Music</Label>
								<div className="relative">
									<ExternalLink className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id={`${id}-appleMusic`}
										type="url"
										className="pl-9"
										value={formData.socialLinks.appleMusic}
										onChange={(e) =>
											updateField("socialLinks", {
												...formData.socialLinks,
												appleMusic: e.target.value,
											})
										}
										placeholder="https://music.apple.com/artist/..."
									/>
								</div>
							</div>
						</div>
						{errors.socialLinks && (
							<p className="text-destructive text-sm">{errors.socialLinks}</p>
						)}
					</div>

					<div className="space-y-6">
						<div className="flex items-center gap-2 font-semibold text-lg">
							<ImageIcon className="h-5 w-5 text-primary" />
							<span>Visuels additionnels</span>
						</div>
						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Bannière</Label>
								<ImageUpload
									value={formData.bannerUrl}
									onChange={(url) => updateField("bannerUrl", url)}
									onRemove={() => updateField("bannerUrl", "")}
									label="Déposez votre bannière ici"
									aspectRatio="video"
									cropAspectRatio={16 / 9}
								/>
							</div>
							<div className="space-y-2">
								<Label>Galerie</Label>
								<ImageUpload
									value=""
									onChange={(url) => {
										if (formData.images.includes(url)) {
											toast.error("Cette image est déjà ajoutée.");
											return;
										}
										updateField("images", [...formData.images, url]);
									}}
									label="Ajouter une image"
									aspectRatio="square"
									enableCrop={false}
								/>
								{formData.images.length > 0 ? (
									<div className="grid grid-cols-3 gap-3">
										{formData.images.map((imageUrl) => (
											<div
												key={imageUrl}
												className="relative overflow-hidden rounded-lg border"
											>
												{/* biome-ignore lint/performance/noImgElement: existing upload preview uses direct remote URL */}
												<img
													src={imageUrl}
													alt="Galerie"
													className="aspect-square w-full object-cover"
												/>
												<Button
													type="button"
													size="sm"
													variant="secondary"
													className="absolute top-2 right-2"
													onClick={() =>
														updateField(
															"images",
															formData.images.filter((img) => img !== imageUrl),
														)
													}
												>
													Retirer
												</Button>
											</div>
										))}
									</div>
								) : (
									<p className="text-muted-foreground text-sm">
										Aucune image ajoutée pour l'instant.
									</p>
								)}
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
								{MUSIC_GENRES.map((genre) => (
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
									onChange={(e) =>
										updateField("techRequirements", e.target.value)
									}
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
									{errors.feeMax && (
										<p className="text-destructive text-sm">{errors.feeMax}</p>
									)}
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`${id}-isNegotiable`}
									checked={formData.isNegotiable}
									onCheckedChange={(checked) =>
										updateField("isNegotiable", checked === true)
									}
								/>
								<Label
									htmlFor={`${id}-isNegotiable`}
									className="cursor-pointer font-normal text-sm"
								>
									Cachet négociable
								</Label>
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
				<Button variant="outline" disabled={isLoading} asChild>
					<Link href="/dashboard">Annuler</Link>
				</Button>
			</div>
		</form>
	);
}
