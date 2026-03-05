// @ts-nocheck
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
	BoomBox,
	Camera,
	FileText,
	Image as ImageIcon,
	Loader2,
	Pencil,
	Plus,
	Save,
	Trash2,
	X,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

interface EditFormData {
	name: string;
	description: string;
	website: string;
	country: string;
	logoUrl: string;
	bannerUrl: string;
	images: string[];
}

export default function MediaProfilePage() {
	const params = useParams();
	const mediaId = params.id as string;
	const { data: session } = authClient.useSession();

	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState<EditFormData | null>(null);

	const {
		data: media,
		isLoading,
		error,
	} = useQuery({
		...trpc.media.getById.queryOptions({ id: mediaId }),
		enabled: !!mediaId,
	});

	const mediaQueryOptions = trpc.media.getById.queryOptions({ id: mediaId });

	const updateMutation = useMutation({
		...trpc.media.update.mutationOptions(),
		onSuccess: (updatedMedia) => {
			queryClient.setQueryData(mediaQueryOptions.queryKey, updatedMedia);
			toast.success("Modifications enregistrées !");
			setIsEditMode(false);
		},
		onError: (err) => {
			toast.error(err.message ?? "Erreur lors de la sauvegarde");
		},
	} as any);

	const isOwner = session?.user?.id === media?.ownerId;

	interface EditFormData {
		name: string;
		description: string;
		website: string;
		country: string;
		logoUrl: string;
	}

	const enterEditMode = useCallback(() => {
		if (!media) return;

		setFormData({
			name: media.name,
			description: media.description || "",
			website: media.website || "",
			country: media.country || "France",
			logoUrl: media.logoUrl || "",
		});

		setIsEditMode(true);
	}, [media]);

	const saveChanges = useCallback(async () => {
		if (!media || !formData) return;

		await updateMutation.mutateAsync({
			id: media.id,
			data: {
				name: formData.name,
				description: formData.description || null,
				website: formData.website || null,
				country: formData.country || null,
				logoUrl: formData.logoUrl || null,
			},
		});
	}, [media, formData, updateMutation]);

	const cancelEditMode = useCallback(() => {
		setFormData(null);
		setIsEditMode(false);
	}, []);

	if (isLoading) {
		return <div className="p-8 text-white">Chargement...</div>;
	}

	if (error || !media) {
		notFound();
	}

	const displayData =
		isEditMode && formData
			? formData
			: {
					name: media.name,
					description: media.description || "",
					website: media.website || "",
					country: media.country || "",
					logoUrl: media.logoUrl || "",
					bannerUrl: media.bannerUrl || "",
					images: media.images || [],
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
										<BoomBox className="h-5 w-5 text-white/70" />
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

				{/* HEADER */}
				<div className="relative rounded-2xl bg-black/20 p-6">
					<div className="flex items-center gap-6">
						<div className="h-24 w-24 overflow-hidden rounded-full bg-black/50">
							{displayData.logoUrl ? (
								<img
									src={displayData.logoUrl}
									alt=""
									className="h-full w-full object-cover"
								/>
							) : (
								<BoomBox className="m-auto mt-6 h-10 w-10 text-white/40" />
							)}
						</div>

						<div>
							{isEditMode ? (
								<Input
									value={formData?.name}
									onChange={(e) =>
										setFormData((prev) =>
											prev ? { ...prev, name: e.target.value } : prev,
										)
									}
								/>
							) : (
								<h1 className="font-bold text-2xl text-white">
									{displayData.name}
								</h1>
							)}

							<p className="text-white/50">{displayData.country}</p>
						</div>
					</div>
				</div>

				{/* DESCRIPTION */}
				<div className="mt-6 rounded-xl bg-black/20 p-6">
					<h2 className="mb-4 flex items-center gap-2 font-semibold text-white text-xl">
						<FileText className="h-5 w-5" />À propos
					</h2>

					{isEditMode ? (
						<Textarea
							value={formData?.description}
							onChange={(e) =>
								setFormData({
									...formData!,
									description: e.target.value,
								})
							}
						/>
					) : (
						<p className="whitespace-pre-wrap text-white/70">
							{displayData.description || "Aucune description."}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
