"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Building2,
	Calendar,
	Camera,
	Check,
	Image as ImageIcon,
	Loader2,
	MapPin,
	Music,
	Pencil,
	Play,
	Plus,
	Save,
	Trash2,
	Users,
	X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
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
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";
import { getVenueTypeLabel } from "@/utils/venue-labels";

const VenueMap = dynamic(() => import("@/components/ui/venue-map"), {
	ssr: false,
	loading: () => (
		<div className="flex aspect-video w-full animate-pulse items-center justify-center rounded-lg bg-white/5 text-white/20">
			Chargement de la carte...
		</div>
	),
});

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

// Music genres
const MUSIC_GENRES = [
	"Pop",
	"Rock",
	"Folk",
	"Jazz",
	"Blues",
	"Electro",
	"Hip-Hop",
	"R&B",
	"Soul",
	"Funk",
	"Reggae",
	"Metal",
	"Punk",
	"Indie",
	"Classique",
	"World Music",
	"Chanson française",
	"Variété",
	"Acoustique",
	"DJ Set",
];

interface EditFormData {
	name: string;
	venueType: string;
	description: string;
	address: string;
	city: string;
	postalCode: string;
	country: string;
	capacity: number | null;
	photoUrl: string;
	logoUrl: string;
	genreNames: string[];
	images: string[];
}

export default function VenueProfilePage() {
	const params = useParams();
	const venueId = params.id as string;
	const { data: session } = authClient.useSession();

	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState<EditFormData | null>(null);
	const [isEditingLogo, setIsEditingLogo] = useState(false);
	const [isEditingBanner, setIsEditingBanner] = useState(false);
	const [isAddingGalleryImage, setIsAddingGalleryImage] = useState(false);

	const {
		data: venue,
		isLoading,
		error,
	} = useQuery({
		...trpc.venue.getById.queryOptions({ id: venueId }),
		enabled: !!venueId,
	});

	// Get the correct query key
	const venueQueryOptions = trpc.venue.getById.queryOptions({ id: venueId });

	const updateMutation = useMutation({
		...trpc.venue.update.mutationOptions(),
		onSuccess: (updatedVenue) => {
			queryClient.setQueryData(venueQueryOptions.queryKey, (oldData: any) => {
				if (!oldData) return updatedVenue;
				return {
					...oldData,
					...updatedVenue,
					owner: oldData.owner,
				};
			});
			queryClient.invalidateQueries({ queryKey: venueQueryOptions.queryKey });
			toast.success("Modifications enregistrées !");
			setIsEditMode(false);
		},
		onError: (error) => {
			toast.error(error.message || "Erreur lors de la sauvegarde");
		},
	});

	// Check if current user is the owner
	const isOwner = session?.user?.id === venue?.owner?.id;

	// Initialize form data when entering edit mode
	const enterEditMode = useCallback(() => {
		if (!venue) return;
		setFormData({
			name: venue.name,
			venueType: venue.venueType as any,
			description: venue.description || "",
			address: venue.address,
			city: venue.city,
			postalCode: venue.postalCode,
			country: venue.country,
			capacity: venue.capacity,
			photoUrl: venue.photoUrl || "",
			logoUrl: venue.logoUrl || "",
			genreNames: venue.genres?.map((g: any) => g.name) || [],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			images: (venue as any).images || [],
		});
		setIsEditMode(true);
	}, [venue]);

	const cancelEditMode = useCallback(() => {
		setFormData(null);
		setIsEditMode(false);
	}, []);

	const saveChanges = useCallback(async () => {
		if (!venue || !formData) return;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { venueType, ...rest } = formData;
		await updateMutation.mutateAsync({
			id: venue.id,
			data: {
				...rest,
				capacity: formData.capacity || null,
				description: formData.description || null,
				photoUrl: formData.photoUrl || null,
				logoUrl: formData.logoUrl || null,
				venueType: formData.venueType as any,
				images: formData.images,
			},
		});
	}, [venue, formData, updateMutation]);

	const updateFormField = useCallback(
		<K extends keyof EditFormData>(field: K, value: EditFormData[K]) => {
			setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
		},
		[],
	);

	// Handle image changes (these save immediately, not on form submit)
	// Handle image changes (updates local state, saves on form submit)
	const handleImageChange = useCallback(
		(field: "logoUrl" | "photoUrl", url: string | null) => {
			updateFormField(field, url || "");
			if (field === "logoUrl") setIsEditingLogo(false);
			if (field === "photoUrl") setIsEditingBanner(false);
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

	if (error || !venue) {
		notFound();
	}

	// Use form data in edit mode, otherwise use venue data
	const displayData =
		isEditMode && formData
			? formData
			: {
					name: venue.name,
					venueType: venue.venueType,
					description: venue.description || "",
					address: venue.address,
					city: venue.city,
					postalCode: venue.postalCode,
					country: venue.country,
					capacity: venue.capacity,
					photoUrl: venue.photoUrl || "",
					logoUrl: venue.logoUrl || "",
					genreNames: venue.genres?.map((g: any) => g.name) || [],
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					images: (venue as any).images || [],
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
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
										<Pencil className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-semibold text-white">Mode édition</p>
										<p className="text-sm text-white/50">
											Modifiez les informations de votre lieu
										</p>
									</div>
								</>
							) : (
								<>
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
										<Building2 className="h-5 w-5 text-white/70" />
									</div>
									<div>
										<p className="font-semibold text-white">Votre lieu</p>
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
								{displayData.photoUrl ? (
									<img
										src={displayData.photoUrl}
										alt="Couverture"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<ImageIcon className="h-10 w-10 text-white/10" />
									</div>
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

							{/* Logo */}
							<div className="relative -mt-12 mb-3">
								<div className="group relative h-24 w-24 overflow-hidden rounded-full border-4 border-black bg-zinc-900 shadow-xl">
									{displayData.logoUrl ? (
										<img
											src={displayData.logoUrl}
											alt={displayData.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<Building2 className="h-10 w-10 text-white/30" />
										</div>
									)}

									{/* Edit overlay for owner */}
									{isOwner && isEditMode && (
										<button
											type="button"
											onClick={() => setIsEditingLogo(true)}
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
											value={formData?.name || ""}
											onChange={(e) => updateFormField("name", e.target.value)}
											className="text-center font-bold text-lg"
											placeholder="Nom du lieu"
										/>
										<Select
											value={formData?.venueType}
											onValueChange={(value) =>
												updateFormField("venueType", value)
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Type de lieu" />
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
								) : (
									<>
										<h1 className="font-bold text-white text-xl">
											{displayData.name}
										</h1>
										<span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
											{getVenueTypeLabel(displayData.venueType)}
										</span>
									</>
								)}

								<p className="mt-3 flex items-center justify-center gap-1 text-sm text-white/50">
									<MapPin className="h-3 w-3" />
									{displayData.city}
									{displayData.capacity && (
										<>
											<span className="mx-1">•</span>
											<Users className="h-3 w-3" />
											{displayData.capacity}
										</>
									)}
								</p>

								{/* Action Buttons */}
								{!isOwner && (
									<div className="mt-6 flex justify-center gap-3">
										<Button className="rounded-full bg-primary px-6 hover:bg-primary/90">
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
									{MUSIC_GENRES.map((genre) => {
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
												className="border-primary/30 bg-primary/10 text-white/80"
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

						{/* Capacity (in edit mode) */}
						{isEditMode && (
							<div className="rounded-xl bg-black/20 p-4">
								<Label className="text-sm text-white/50">
									Capacité (personnes)
								</Label>
								<Input
									type="number"
									value={formData?.capacity || ""}
									onChange={(e) =>
										updateFormField(
											"capacity",
											e.target.value
												? Number.parseInt(e.target.value, 10)
												: null,
										)
									}
									placeholder="Ex: 200"
									className="mt-2"
								/>
							</div>
						)}

						{/* Stats */}
						{!isEditMode && (
							<div className="rounded-xl bg-black/20 p-4">
								<div className="grid grid-cols-2 gap-4 text-center">
									<div>
										<p className="font-bold text-2xl text-primary">0</p>
										<p className="text-white/50 text-xs">Événements</p>
									</div>
									<div>
										<p className="font-bold text-2xl text-primary">0</p>
										<p className="text-white/50 text-xs">Abonnés</p>
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
								{(
									(isEditMode
										? formData?.images
										: (displayData as any).images) || []
								).map((img: string, i: number) => (
									<div
										key={img}
										className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/50"
									>
										<img
											src={img}
											alt={`Gallery ${i}`}
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
								{(
									(isEditMode
										? formData?.images
										: (displayData as any).images) || []
								).length === 0 && (
									<div className="col-span-full flex h-32 flex-col items-center justify-center rounded-lg border border-white/10 border-dashed bg-white/5 text-white/30">
										<ImageIcon className="mb-2 h-8 w-8 opacity-50" />
										<p className="text-sm">Aucune photo dans la galerie</p>
									</div>
								)}
							</div>
						</div>

						{/* A propos Section */}
						<div className="rounded-xl bg-black/20 p-6">
							<h2 className="mb-4 font-semibold text-white text-xl">
								A propos
							</h2>
							{isEditMode ? (
								<Textarea
									value={formData?.description || ""}
									onChange={(e) =>
										updateFormField("description", e.target.value)
									}
									placeholder="Décrivez votre lieu, son ambiance, son histoire..."
									rows={5}
									className="w-full"
								/>
							) : (
								<p className="whitespace-pre-wrap text-white/70 leading-relaxed">
									{displayData.description || (
										<span className="text-white/30 italic">
											Aucune description disponible.
										</span>
									)}
								</p>
							)}
						</div>

						{/* Address Section */}
						<div className="rounded-xl bg-black/20 p-6">
							<h2 className="mb-4 flex items-center gap-2 font-semibold text-white text-xl">
								<MapPin className="h-5 w-5" />
								Localisation
							</h2>

							{isEditMode ? (
								<div className="space-y-4">
									<AddressAutocomplete
										value={formData?.address || ""}
										onChange={(address, city, postalCode) => {
											updateFormField("address", address);
											updateFormField("city", city);
											updateFormField("postalCode", postalCode);
										}}
									/>
									<div className="grid gap-4 md:grid-cols-3">
										<div>
											<Label className="text-white/50">Ville</Label>
											<Input
												value={formData?.city || ""}
												onChange={(e) =>
													updateFormField("city", e.target.value)
												}
												className="mt-1"
											/>
										</div>
										<div>
											<Label className="text-white/50">Code postal</Label>
											<Input
												value={formData?.postalCode || ""}
												onChange={(e) =>
													updateFormField("postalCode", e.target.value)
												}
												className="mt-1"
											/>
										</div>
										<div>
											<Label className="text-white/50">Pays</Label>
											<Input
												value={formData?.country || ""}
												onChange={(e) =>
													updateFormField("country", e.target.value)
												}
												className="mt-1"
											/>
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<div>
										<p className="text-white/70">{displayData.address}</p>
										<p className="text-white/50">
											{displayData.postalCode} {displayData.city},{" "}
											{displayData.country}
										</p>
									</div>

									{/* Map */}
									<div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
										<VenueMap
											address={displayData.address}
											city={displayData.city}
											name={displayData.name}
										/>
										<div className="absolute top-4 right-4 z-[400]">
											<Button
												size="sm"
												className="bg-white/90 text-black shadow-lg backdrop-blur-sm hover:bg-white"
												asChild
											>
												<a
													href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${displayData.address}, ${displayData.postalCode} ${displayData.city}`)}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<MapPin className="mr-2 h-4 w-4" />
													S'y rendre
												</a>
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Prochains événements Section */}
						{!isEditMode && (
							<div className="rounded-xl bg-black/20 p-6">
								<h2 className="mb-4 flex items-center gap-2 font-semibold text-white text-xl">
									Prochains événements
								</h2>

								<div className="grid gap-4 md:grid-cols-2">
									<div className="flex gap-4 rounded-lg bg-black/30 p-4">
										<div className="flex-1">
											<p className="text-sm text-white/50 italic">
												Aucun événement programmé pour le moment.
											</p>
											<Button
												variant="outline"
												size="sm"
												className="mt-3 border-white/20 text-white/70"
												disabled
											>
												<Calendar className="mr-2 h-4 w-4" />
												Créer un événement
											</Button>
										</div>
									</div>

									<div className="flex min-h-[120px] items-center justify-center rounded-lg bg-black/30 p-4">
										<div className="text-center text-white/30">
											<ImageIcon className="mx-auto h-8 w-8" />
											<p className="mt-2 text-xs">Image promo</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</main>
				</div>
			</div>

			{/* Logo Edit Modal */}
			{isEditingLogo && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
					<div className="mx-4 w-full max-w-md rounded-2xl bg-zinc-900 p-6">
						<h3 className="mb-4 font-semibold text-lg text-white">
							Modifier le logo
						</h3>
						<ImageUpload
							value={displayData.logoUrl || ""}
							onChange={(url) => handleImageChange("logoUrl", url || null)}
							onRemove={() => handleImageChange("logoUrl", null)}
							aspectRatio="square"
							cropAspectRatio={1}
							label="Déposez votre logo ici"
						/>
						<Button
							type="button"
							variant="ghost"
							className="mt-4 w-full"
							onClick={() => setIsEditingLogo(false)}
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
							value={displayData.photoUrl || ""}
							onChange={(url) => handleImageChange("photoUrl", url || null)}
							onRemove={() => handleImageChange("photoUrl", null)}
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
							label="Déposez votre photo ici"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
