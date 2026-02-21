// @ts-nocheck
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Camera,
	Euro,
	FileText,
	Image as ImageIcon,
	Loader2,
	Mic2,
	Music,
	Pencil,
	Plus,
	Save,
	Trash2,
	X,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

interface EditFormData {
	stageName: string;
	bio: string;
	website: string;
	techRequirements: string;
	feeMin: number | null;
	feeMax: number | null;
	photoUrl: string;
	bannerUrl: string;
	genreNames: string[];
	images: string[];
}

export default function ArtistProfilePage() {
	const params = useParams();
	const artistId = params.id as string;
	const { data: session } = authClient.useSession();

	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState<EditFormData | null>(null);
	const [isEditingPhoto, setIsEditingPhoto] = useState(false);
	const [isEditingBanner, setIsEditingBanner] = useState(false);
	const [isAddingGalleryImage, setIsAddingGalleryImage] = useState(false);

	const {
		data: artist,
		isLoading,
		error,
	} = useQuery({
		...trpc.artist.getById.queryOptions({ id: artistId }),
		enabled: !!artistId,
	});

	const { data: availableGenres = [] } = useQuery(
		trpc.venue.getAllGenres.queryOptions(),
	);

	// Get the correct query key
	const artistQueryOptions = trpc.artist.getById.queryOptions({ id: artistId });

	const updateMutation = useMutation({
		...trpc.artist.update.mutationOptions(),
		onSuccess: (updatedArtist: any) => {
			queryClient.setQueryData(artistQueryOptions.queryKey, (oldData: any) => {
				if (!oldData) return updatedArtist;
				return {
					...oldData,
					...updatedArtist,
					user: oldData.user,
				};
			});
			queryClient.invalidateQueries({ queryKey: artistQueryOptions.queryKey });
			toast.success("Modifications enregistrées !");
			setIsEditMode(false);
		},
		onError: (err: any) => {
			toast.error(err.message || "Erreur lors de la sauvegarde");
		},
	} as any);

	// Check if current user is the owner
	const isOwner = session?.user?.id === artist?.user?.id;

	// Initialize form data when entering edit mode
	const enterEditMode = useCallback(() => {
		if (!artist) return;
		setFormData({
			stageName: artist.stageName,
			bio: artist.bio || "",
			website: artist.website || "",
			techRequirements: artist.techRequirements || "",
			feeMin: artist.feeMin ?? null,
			feeMax: artist.feeMax ?? null,
			photoUrl: artist.photoUrl || "",
			bannerUrl: artist.bannerUrl || "",
			genreNames: artist.genres?.map((g: any) => g.name) || [],
			images: artist.images || [],
		});
		setIsEditMode(true);
	}, [artist]);

	const cancelEditMode = useCallback(() => {
		setFormData(null);
		setIsEditMode(false);
	}, []);

	const updateFormField = useCallback(
		<K extends keyof EditFormData>(field: K, value: EditFormData[K]) => {
			setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
		},
		[],
	);

	const saveChanges = useCallback(async () => {
		if (!artist || !formData) return;
		await updateMutation.mutateAsync({
			id: artist.id,
			data: {
				stageName: formData.stageName,
				bio: formData.bio || null,
				website: formData.website || null,
				techRequirements: formData.techRequirements || null,
				feeMin: formData.feeMin,
				feeMax: formData.feeMax,
				photoUrl: formData.photoUrl || null,
				bannerUrl: formData.bannerUrl || null,
				genreNames: formData.genreNames,
				images: formData.images,
			},
		} as any);
	}, [artist, formData, updateMutation]);

	const handleImageChange = useCallback(
		(field: "photoUrl" | "bannerUrl", url: string | null) => {
			updateFormField(field, url || "");
			if (field === "photoUrl") setIsEditingPhoto(false);
			if (field === "bannerUrl") setIsEditingBanner(false);
		},
		[updateFormField],
	);

	const handleAddGalleryImage = useCallback(
		(url: string | null) => {
			if (url && formData) {
				updateFormField("images", [...formData.images, url]);
				setIsAddingGalleryImage(false);
			}
		},
		[formData, updateFormField],
	);

	const handleRemoveGalleryImage = useCallback(
		(index: number) => {
			if (formData) {
				const newImages = [...formData.images];
				newImages.splice(index, 1);
				updateFormField("images", newImages);
			}
		},
		[formData, updateFormField],
	);

	if (isLoading) {
		return (
			<div className="min-h-screen p-8">
				<div className="flex animate-pulse gap-8">
					<div className="w-80 space-y-4">
						<div className="mx-auto h-56 w-56 rounded-2xl bg-white/10" />
						<div className="mx-auto h-8 w-48 rounded bg-white/10" />
					</div>
					<div className="flex-1 space-y-4">
						<div className="aspect-video rounded-xl bg-white/10" />
					</div>
				</div>
			</div>
		);
	}

	if (error || !artist) {
		notFound();
	}

	// Use form data in edit mode, otherwise use artist data
	const displayData =
		isEditMode && formData
			? formData
			: {
					stageName: artist.stageName,
					bio: artist.bio || "",
					website: artist.website || "",
					techRequirements: artist.techRequirements || "",
					feeMin: artist.feeMin ?? null,
					feeMax: artist.feeMax ?? null,
					photoUrl: artist.photoUrl || "",
					bannerUrl: artist.bannerUrl || "",
					genreNames: artist.genres?.map((g: any) => g.name) || [],
					images: artist.images || [],
				};

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8">
				{/* Edit Mode Header */}
				{isOwner && (
					<div className="mb-6 flex items-center justify-between rounded-xl bg-black/20 p-4">
						<div className="flex items-center gap-3">
							{isEditMode ? (
								<>
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
										<Pencil className="h-5 w-5 text-secondary" />
									</div>
									<div>
										<p className="font-semibold text-white">Mode édition</p>
										<p className="text-sm text-white/50">
											Modifiez les informations de votre projet
										</p>
									</div>
								</>
							) : (
								<>
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
										<Mic2 className="h-5 w-5 text-white/70" />
									</div>
									<div>
										<p className="font-semibold text-white">Votre projet</p>
										<p className="text-sm text-white/50">
											Cliquez sur Modifier pour éditer
										</p>
									</div>
								</>
							)}
						</div>
						<div className="flex gap-2">
							{isEditMode ? (
								<>
									<Button
										variant="ghost"
										onClick={cancelEditMode}
										disabled={updateMutation.isPending}
									>
										<X className="mr-2 h-4 w-4" />
										Annuler
									</Button>
									<Button
										onClick={saveChanges}
										disabled={updateMutation.isPending}
									>
										{updateMutation.isPending ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Save className="mr-2 h-4 w-4" />
										)}
										Enregistrer
									</Button>
								</>
							) : (
								<Button onClick={enterEditMode}>
									<Pencil className="mr-2 h-4 w-4" />
									Modifier
								</Button>
							)}
						</div>
					</div>
				)}

				<div className="grid gap-8 lg:grid-cols-[320px_1fr]">
					{/* LEFT SIDEBAR - Profile Card */}
					<aside className="space-y-6">
						{/* Profile Card */}
						<div className="relative flex flex-col items-center overflow-hidden rounded-2xl bg-black/20 pb-6">
							{/* Cover Image (Banner) */}
							<div className="group relative aspect-video w-full bg-zinc-900/50">
								{displayData.bannerUrl ? (
									<img
										src={displayData.bannerUrl}
										alt="Couverture"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="h-full w-full bg-gradient-to-br from-secondary/20 to-accent/20" />
								)}

								{/* Edit overlay for owner */}
								{isOwner && isEditMode && (
									<button
										type="button"
										onClick={() => setIsEditingBanner(true)}
										className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<Camera className="h-8 w-8 text-white" />
									</button>
								)}
							</div>

							{/* Avatar */}
							<div className="relative -mt-12 mb-3">
								<div className="group relative h-24 w-24 overflow-hidden rounded-full border-4 border-black bg-zinc-900 shadow-xl">
									{displayData.photoUrl ? (
										<img
											src={displayData.photoUrl}
											alt={displayData.stageName}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<Mic2 className="h-10 w-10 text-white/30" />
										</div>
									)}

									{/* Edit overlay for owner */}
									{isOwner && isEditMode && (
										<button
											type="button"
											onClick={() => setIsEditingPhoto(true)}
											className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
										>
											<Camera className="h-6 w-6 text-white" />
										</button>
									)}
								</div>
							</div>

							{/* Name and Info */}
							<div className="w-full px-4 text-center">
								{isEditMode ? (
									<div className="space-y-3">
										<Input
											value={formData?.stageName || ""}
											onChange={(e) =>
												updateFormField("stageName", e.target.value)
											}
											className="text-center font-bold text-lg"
											placeholder="Nom de scène"
										/>
									</div>
								) : (
									<>
										<h1 className="font-bold text-white text-xl">
											{displayData.stageName}
										</h1>
										<span className="mt-1 inline-block rounded-full bg-secondary/10 px-3 py-1 font-medium text-secondary text-xs">
											Artiste
										</span>
									</>
								)}

								{/* Action Buttons */}
								{!isOwner && (
									<div className="mt-6 flex justify-center gap-3">
										<Button className="rounded-full bg-secondary px-6 hover:bg-secondary/90">
											<Plus className="mr-2 h-4 w-4" />
											Suivre
										</Button>
									</div>
								)}
							</div>
						</div>

						{/* Genres Tags */}
						<div className="rounded-xl bg-black/20 p-4">
							<div className="mb-2 flex items-center gap-2 text-sm text-white/50">
								<Music className="h-4 w-4" />
								Genres
							</div>

							{isEditMode ? (
								<div className="max-h-48 space-y-2 overflow-y-auto">
									{availableGenres.map((genre) => {
										const isSelected = formData?.genreNames.includes(genre);
										return (
											<div key={genre} className="flex items-center space-x-2">
												<Checkbox
													id={`genre-${genre}`}
													checked={isSelected}
													onCheckedChange={(checked) => {
														const newGenres = checked
															? [...(formData?.genreNames || []), genre]
															: (formData?.genreNames || []).filter(
																	(g) => g !== genre,
																);
														updateFormField("genreNames", newGenres);
													}}
												/>
												<Label
													htmlFor={`genre-${genre}`}
													className="cursor-pointer text-sm text-white/70"
												>
													{genre}
												</Label>
											</div>
										);
									})}
								</div>
							) : (
								<div className="flex flex-wrap gap-2">
									{displayData.genreNames.length > 0 ? (
										displayData.genreNames.map((genre) => (
											<Badge
												key={genre}
												variant="outline"
												className="border-secondary/30 bg-secondary/10 text-white/80"
											>
												{genre}
											</Badge>
										))
									) : (
										<p className="text-sm text-white/30 italic">
											Aucun genre défini
										</p>
									)}
								</div>
							)}
						</div>

						{/* Fees (in edit mode) */}
						{isEditMode && (
							<div className="rounded-xl bg-black/20 p-4">
								<div className="mb-3 flex items-center gap-2 text-sm text-white/50">
									<Euro className="h-4 w-4" />
									Tarifs
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label className="text-sm text-white/50">Min (€)</Label>
										<Input
											type="number"
											value={formData?.feeMin ?? ""}
											onChange={(e) =>
												updateFormField(
													"feeMin",
													e.target.value
														? Number.parseInt(e.target.value, 10)
														: null,
												)
											}
											className="mt-1"
										/>
									</div>
									<div>
										<Label className="text-sm text-white/50">
											Souhaité (€)
										</Label>
										<Input
											type="number"
											value={formData?.feeMax ?? ""}
											onChange={(e) =>
												updateFormField(
													"feeMax",
													e.target.value
														? Number.parseInt(e.target.value, 10)
														: null,
												)
											}
											className="mt-1"
										/>
									</div>
								</div>
							</div>
						)}
					</aside>

					{/* MAIN CONTENT */}
					<main className="space-y-6">
						{/* Gallery Section */}
						<div className="rounded-xl bg-black/20 p-6">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="flex items-center gap-2 font-semibold text-white text-xl">
									<ImageIcon className="h-5 w-5" />
									Galerie photos
								</h2>
								{isOwner && isEditMode && (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => setIsAddingGalleryImage(true)}
									>
										<Plus className="mr-2 h-4 w-4" />
										Ajouter
									</Button>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
								{displayData.images.map((img, i) => (
									<div
										key={img}
										className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/50"
									>
										<img
											src={img}
											alt={`Galerie ${i + 1}`}
											className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
										/>
										{isOwner && isEditMode && (
											<button
												type="button"
												onClick={() => handleRemoveGalleryImage(i)}
												className="absolute top-2 right-2 rounded-md bg-red-500/80 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-600 group-hover:opacity-100"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										)}
									</div>
								))}

								{displayData.images.length === 0 && (
									<div className="col-span-full flex h-32 flex-col items-center justify-center rounded-lg border border-white/10 border-dashed bg-white/5 text-white/30">
										<ImageIcon className="mb-2 h-8 w-8 opacity-50" />
										<p className="text-sm">Aucune photo dans la galerie</p>
									</div>
								)}
							</div>
						</div>

						{/* About Section */}
						<div className="rounded-xl bg-black/20 p-6">
							<h2 className="mb-4 flex items-center gap-2 font-semibold text-white text-xl">
								<FileText className="h-5 w-5" /> A propos
							</h2>
							{isEditMode ? (
								<Textarea
									value={formData?.bio || ""}
									onChange={(e) => updateFormField("bio", e.target.value)}
									placeholder="Décrivez votre projet, votre univers..."
									rows={5}
									className="w-full"
								/>
							) : (
								<p className="whitespace-pre-wrap text-white/70 leading-relaxed">
									{displayData.bio || (
										<span className="text-white/30 italic">
											Aucune description disponible.
										</span>
									)}
								</p>
							)}
						</div>

						{/* Links & Tech */}
						<div className="grid gap-6 lg:grid-cols-2">
							<div className="rounded-xl bg-black/20 p-6">
								<h2 className="mb-4 font-semibold text-white text-xl">Liens</h2>
								{isEditMode ? (
									<div className="space-y-2">
										<Label className="text-white/50">Site web</Label>
										<Input
											value={formData?.website || ""}
											onChange={(e) =>
												updateFormField("website", e.target.value)
											}
											placeholder="https://..."
										/>
									</div>
								) : displayData.website ? (
									<Button
										asChild
										variant="secondary"
										className="bg-white/10 text-white hover:bg-white/15"
									>
										<a
											href={displayData.website}
											target="_blank"
											rel="noopener noreferrer"
										>
											Ouvrir le site
										</a>
									</Button>
								) : (
									<p className="text-sm text-white/30 italic">Aucun lien</p>
								)}
							</div>

							<div className="rounded-xl bg-black/20 p-6">
								<h2 className="mb-4 font-semibold text-white text-xl">
									Technique
								</h2>
								{isEditMode ? (
									<Textarea
										value={formData?.techRequirements || ""}
										onChange={(e) =>
											updateFormField("techRequirements", e.target.value)
										}
										placeholder="Ex: 2 micros, DI, retours..."
										rows={5}
										className="w-full"
									/>
								) : (
									<p className="whitespace-pre-wrap text-white/70 leading-relaxed">
										{displayData.techRequirements || (
											<span className="text-white/30 italic">
												Aucune fiche technique.
											</span>
										)}
									</p>
								)}
							</div>
						</div>
					</main>
				</div>
			</div>

			{/* Photo Edit Modal */}
			{isEditingPhoto && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
					<div className="mx-4 w-full max-w-md rounded-2xl bg-zinc-900 p-6">
						<h3 className="mb-4 font-semibold text-lg text-white">
							Modifier la photo
						</h3>
						<ImageUpload
							value={displayData.photoUrl || ""}
							onChange={(url) => handleImageChange("photoUrl", url || null)}
							onRemove={() => handleImageChange("photoUrl", null)}
							aspectRatio="square"
							cropAspectRatio={1}
							circularCrop
							label="Déposez votre photo ici"
						/>
						<Button
							type="button"
							variant="ghost"
							className="mt-4 w-full"
							onClick={() => setIsEditingPhoto(false)}
						>
							Annuler
						</Button>
					</div>
				</div>
			)}

			{/* Banner Edit Modal */}
			{isEditingBanner && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
					<div className="mx-4 w-full max-w-2xl rounded-2xl bg-zinc-900 p-6">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-semibold text-lg text-white">
								Modifier la bannière
							</h3>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsEditingBanner(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
						<ImageUpload
							value={displayData.bannerUrl || ""}
							onChange={(url) => handleImageChange("bannerUrl", url || null)}
							onRemove={() => handleImageChange("bannerUrl", null)}
							aspectRatio="video"
							cropAspectRatio={16 / 9}
							label="Déposez votre bannière ici"
						/>
					</div>
				</div>
			)}

			{/* Gallery Add Modal */}
			{isAddingGalleryImage && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
					<div className="mx-4 w-full max-w-2xl rounded-2xl bg-zinc-900 p-6">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-semibold text-lg text-white">
								Ajouter une photo
							</h3>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsAddingGalleryImage(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
						<ImageUpload
							value=""
							onChange={(url) => handleAddGalleryImage(url)}
							aspectRatio="video"
							enableCrop={false}
							label="Déposez votre photo ici"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
