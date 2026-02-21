"use client";

import { useDropzone } from "@uploadthing/react";
import { Crop, FileIcon, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/utils/uploadthing";
import { Button } from "./button";
import { ImageCropper } from "./image-cropper";

interface ImageUploadProps {
	value?: string;
	onChange: (url: string) => void;
	onRemove?: () => void;
	label?: string;
	className?: string;
	aspectRatio?: "square" | "video" | "auto";
	enableCrop?: boolean;
	cropAspectRatio?: number; // e.g., 1 for square, 16/9 for banner
	circularCrop?: boolean;
}

export function ImageUpload({
	value,
	onChange,
	onRemove,
	label = "Déposez une image ici",
	className,
	aspectRatio = "auto",
	enableCrop = true,
	cropAspectRatio,
	circularCrop = false,
}: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingImage, setPendingImage] = useState<string | null>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	const { startUpload, routeConfig } = useUploadThing("imageUploader", {
		onClientUploadComplete: (res) => {
			if (res?.[0]) {
				const url = res[0].url || res[0].serverData?.url;
				if (url) {
					onChange(url);
					setError(null);
				}
			}
			setIsUploading(false);
		},
		onUploadError: (err) => {
			setError(err.message);
			setIsUploading(false);
		},
		onUploadBegin: () => {
			setIsUploading(true);
			setError(null);
		},
	});

	// Compute crop aspect ratio based on aspectRatio prop if not explicitly provided
	const computedCropAspectRatio =
		cropAspectRatio ??
		(aspectRatio === "square"
			? 1
			: aspectRatio === "video"
				? 16 / 9
				: undefined);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles.length > 0) {
				const file = acceptedFiles[0];
				if (enableCrop && computedCropAspectRatio !== undefined) {
					// Show cropper first
					const reader = new FileReader();
					reader.onload = () => {
						setPendingImage(reader.result as string);
						setPendingFile(file);
					};
					reader.readAsDataURL(file);
				} else {
					// Direct upload without cropping
					startUpload(acceptedFiles);
				}
			}
		},
		[startUpload, enableCrop, computedCropAspectRatio],
	);

	const handleCropComplete = useCallback(
		async (croppedBlob: Blob) => {
			// Convert blob to file for upload
			const croppedFile = new File(
				[croppedBlob],
				pendingFile?.name || "cropped-image.jpg",
				{ type: "image/jpeg" },
			);
			setPendingImage(null);
			setPendingFile(null);
			startUpload([croppedFile]);
		},
		[pendingFile, startUpload],
	);

	const handleCropCancel = useCallback(() => {
		setPendingImage(null);
		setPendingFile(null);
	}, []);

	const handleEditCrop = useCallback(() => {
		if (value) {
			setPendingImage(value);
		}
	}, [value]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { getRootProps, getInputProps, isDragActive } = (useDropzone as any)({
		onDrop,
		accept: generateClientDropzoneAccept(["image"]),
		maxFiles: 1,
		disabled: isUploading,
		noClick: true,
	});

	const inputRef = useRef<HTMLInputElement>(null);

	const handleReplace = useCallback(() => {
		inputRef.current?.click();
	}, []);

	// Merge refs helper
	const { ref: dropzoneRef, ...inputProps } = getInputProps();
	const setMergedRef = useCallback(
		(element: HTMLInputElement | null) => {
			// Handle dropzone ref (it's usually a callback)
			if (typeof dropzoneRef === "function") {
				(dropzoneRef as (instance: HTMLInputElement | null) => void)(element);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} else if (dropzoneRef) {
				(dropzoneRef as any).current = element;
			}

			// Handle our ref
			inputRef.current = element;
		},
		[dropzoneRef],
	);

	const aspectClass = {
		square: "aspect-square",
		video: "aspect-video",
		auto: "min-h-48",
	}[aspectRatio];

	if (value) {
		return (
			<>
				<div
					{...getRootProps()}
					className={cn(
						"relative overflow-hidden rounded-lg border",
						aspectClass,
						className,
					)}
				>
					<img
						src={value}
						alt="Aperçu"
						className="h-full w-full object-cover"
					/>
					<div className="absolute top-2 right-2 flex gap-2">
						{enableCrop && computedCropAspectRatio !== undefined && (
							<Button
								type="button"
								variant="secondary"
								size="sm"
								className="shadow-sm"
								onClick={(e) => {
									e.stopPropagation();
									handleEditCrop();
								}}
							>
								<Crop className="mr-1 h-3 w-3" />
								Recadrer
							</Button>
						)}
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="shadow-sm"
							onClick={(e) => {
								e.stopPropagation(); // Prevent dropzone click propagation
								handleReplace();
							}}
						>
							<Pencil className="mr-1 h-3 w-3" />
							Remplacer
						</Button>
						{onRemove && (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								className="shadow-sm"
								onClick={(e) => {
									e.stopPropagation();
									onRemove();
								}}
							>
								<Trash2 className="mr-1 h-3 w-3" />
								Supprimer
							</Button>
						)}
					</div>
					<input {...inputProps} ref={setMergedRef} />
				</div>

				{/* Cropper Modal for editing existing image */}
				{pendingImage && computedCropAspectRatio !== undefined && (
					<ImageCropper
						imageSrc={pendingImage}
						onCropComplete={handleCropComplete}
						onCancel={handleCropCancel}
						aspectRatio={computedCropAspectRatio}
						circularCrop={circularCrop}
						onReplace={handleReplace}
					/>
				)}
			</>
		);
	}

	return (
		<>
			<div
				{...getRootProps()}
				className={cn(
					"relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 transition-colors",
					aspectClass,
					isDragActive && "border-primary bg-primary/5",
					isUploading && "cursor-not-allowed opacity-60",
					error && "border-destructive",
					className,
				)}
			>
				<input {...inputProps} ref={setMergedRef} />

				{isUploading ? (
					<div className="flex flex-col items-center gap-2 text-muted-foreground">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-sm">Téléchargement en cours...</p>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 p-4 text-center">
						<Upload className="h-8 w-8 text-muted-foreground" />
						<p className="font-medium text-primary text-sm">
							{isDragActive ? "Déposez ici !" : label}
						</p>
						<p className="text-muted-foreground text-xs">
							Image (max 8MB)
							{enableCrop &&
								computedCropAspectRatio !== undefined &&
								" • Recadrage disponible"}
						</p>
						{error && <p className="text-destructive text-xs">{error}</p>}
					</div>
				)}
			</div>

			{/* Cropper Modal */}
			{pendingImage && computedCropAspectRatio !== undefined && (
				<ImageCropper
					imageSrc={pendingImage}
					onCropComplete={handleCropComplete}
					onCancel={handleCropCancel}
					aspectRatio={computedCropAspectRatio}
					circularCrop={circularCrop}
					onReplace={handleReplace}
				/>
			)}
		</>
	);
}
