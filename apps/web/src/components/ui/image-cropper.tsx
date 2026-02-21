"use client";

import {
	Check,
	Crop,
	Loader2,
	Pencil,
	RotateCcw,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
	type Crop as CropType,
	centerCrop,
	makeAspectCrop,
	type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ImageCropperProps {
	imageSrc: string;
	onCropComplete: (croppedImageBlob: Blob) => void;
	onCancel: () => void;
	aspectRatio?: number; // e.g., 1 for square, 16/9 for video
	circularCrop?: boolean;
	onReplace?: () => void;
}

function centerAspectCrop(
	mediaWidth: number,
	mediaHeight: number,
	aspect: number,
): CropType {
	return centerCrop(
		makeAspectCrop(
			{
				unit: "%",
				width: 100,
			},
			aspect,
			mediaWidth,
			mediaHeight,
		),
		mediaWidth,
		mediaHeight,
	);
}

export function ImageCropper({
	imageSrc,
	onCropComplete,
	onCancel,
	aspectRatio = 1,
	circularCrop = false,
	onReplace,
}: ImageCropperProps) {
	const imgRef = useRef<HTMLImageElement>(null);
	const [crop, setCrop] = useState<CropType>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
	const [scale, setScale] = useState(1);
	const [rotate, setRotate] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [loadedImageData, setLoadedImageData] = useState<string | null>(null);

	// For remote images, we need to load them as blob first to avoid CORS issues
	useEffect(() => {
		const loadImage = async () => {
			// Check if it's a data URL (local file) or remote URL
			if (imageSrc.startsWith("data:")) {
				setLoadedImageData(imageSrc);
				return;
			}

			// For remote URLs, fetch as blob and convert to data URL
			try {
				const response = await fetch(imageSrc);
				const blob = await response.blob();
				const reader = new FileReader();
				reader.onload = () => {
					setLoadedImageData(reader.result as string);
				};
				reader.readAsDataURL(blob);
			} catch {
				// If fetch fails (CORS), try loading directly with crossOrigin
				setLoadedImageData(imageSrc);
			}
		};

		loadImage();
	}, [imageSrc]);

	const onImageLoad = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement>) => {
			const { width, height } = e.currentTarget;
			setCrop(centerAspectCrop(width, height, aspectRatio));
		},
		[aspectRatio],
	);

	const handleCropComplete = useCallback(async () => {
		if (!completedCrop || !imgRef.current || !loadedImageData) return;

		setIsProcessing(true);

		try {
			const image = imgRef.current;
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				setIsProcessing(false);
				return;
			}

			const scaleX = image.naturalWidth / image.width;
			const scaleY = image.naturalHeight / image.height;

			const pixelRatio = window.devicePixelRatio || 1;

			canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
			canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

			ctx.scale(pixelRatio, pixelRatio);
			ctx.imageSmoothingQuality = "high";

			const cropX = completedCrop.x * scaleX;
			const cropY = completedCrop.y * scaleY;

			const rotateRads = rotate * (Math.PI / 180);
			const centerX = image.naturalWidth / 2;
			const centerY = image.naturalHeight / 2;

			ctx.save();

			// Move to center to rotate around center
			ctx.translate(-cropX, -cropY);
			ctx.translate(centerX, centerY);
			ctx.rotate(rotateRads);
			ctx.scale(scale, scale);
			ctx.translate(-centerX, -centerY);

			ctx.drawImage(
				image,
				0,
				0,
				image.naturalWidth,
				image.naturalHeight,
				0,
				0,
				image.naturalWidth,
				image.naturalHeight,
			);

			ctx.restore();

			canvas.toBlob(
				(blob) => {
					setIsProcessing(false);
					if (blob) {
						onCropComplete(blob);
					}
				},
				"image/jpeg",
				0.95,
			);
		} catch (error) {
			console.error("Error cropping image:", error);
			setIsProcessing(false);
		}
	}, [completedCrop, rotate, scale, onCropComplete, loadedImageData]);

	const handleReset = () => {
		setScale(1);
		setRotate(0);
		if (imgRef.current) {
			const { width, height } = imgRef.current;
			setCrop(centerAspectCrop(width, height, aspectRatio));
		}
	};

	// Show loading state while fetching remote image
	if (!loadedImageData) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
				<div className="flex flex-col items-center gap-4 text-white">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p>Chargement de l'image...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-zinc-700 border-b px-6 py-4">
					<div className="flex items-center gap-2">
						<Crop className="h-5 w-5 text-primary" />
						<h2 className="font-semibold text-lg text-white">
							Ajuster l'image
						</h2>
					</div>
					<div className="flex items-center gap-2">
						{onReplace && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={onReplace}
								className="text-white hover:bg-white/10"
							>
								<Pencil className="mr-2 h-4 w-4" />
								Remplacer
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onCancel}
							className="text-white hover:bg-white/10"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* Crop Area */}
				<div className="flex-1 overflow-auto p-6">
					<div className="flex items-center justify-center">
						<ReactCrop
							crop={crop}
							onChange={(_, percentCrop) => setCrop(percentCrop)}
							onComplete={(c) => setCompletedCrop(c)}
							aspect={aspectRatio}
							circularCrop={circularCrop}
							className={cn(
								"max-h-[50vh] max-w-full",
								circularCrop && "[&_.ReactCrop__crop-selection]:rounded-full",
							)}
						>
							<img
								ref={imgRef}
								alt="À recadrer"
								src={loadedImageData}
								style={{
									transform: `scale(${scale}) rotate(${rotate}deg)`,
									maxHeight: "50vh",
								}}
								onLoad={onImageLoad}
								className="max-w-full"
							/>
						</ReactCrop>
					</div>
				</div>

				{/* Controls */}
				<div className="border-zinc-700 border-t bg-zinc-800/50 px-6 py-4">
					{/* Zoom & Rotate Controls */}
					<div className="mb-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
						{/* Zoom */}
						<div className="flex items-center gap-2">
							<span className="text-sm text-zinc-400">Zoom</span>
							<div className="flex items-center gap-1">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-8 w-8 border-zinc-600 bg-zinc-700 hover:bg-zinc-600"
									onClick={() => setScale((s) => Math.max(1, s - 0.1))}
									disabled={isProcessing}
								>
									<ZoomOut className="h-4 w-4" />
								</Button>
								<div className="w-24 sm:w-32">
									<input
										type="range"
										min="1"
										max="3"
										step="0.1"
										value={scale}
										onChange={(e) => setScale(Number(e.target.value))}
										className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-primary"
										disabled={isProcessing}
									/>
								</div>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-8 w-8 border-zinc-600 bg-zinc-700 hover:bg-zinc-600"
									onClick={() => setScale((s) => Math.min(3, s + 0.1))}
									disabled={isProcessing}
								>
									<ZoomIn className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Rotation */}
						<div className="flex items-center gap-2">
							<span className="text-sm text-zinc-400">Rotation</span>
							<div className="w-20 sm:w-24">
								<input
									type="range"
									min="-180"
									max="180"
									step="1"
									value={rotate}
									onChange={(e) => setRotate(Number(e.target.value))}
									className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-primary"
									disabled={isProcessing}
								/>
							</div>
							<span className="w-10 text-center text-xs text-zinc-400">
								{rotate}°
							</span>
						</div>

						{/* Reset */}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleReset}
							className="text-zinc-400 hover:text-white"
							disabled={isProcessing}
						>
							<RotateCcw className="mr-1 h-4 w-4" />
							Réinitialiser
						</Button>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							className="border-zinc-600 bg-zinc-700 hover:bg-zinc-600"
							disabled={isProcessing}
						>
							Annuler
						</Button>
						<Button
							type="button"
							onClick={handleCropComplete}
							className="gap-2"
							disabled={isProcessing}
						>
							{isProcessing ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Traitement...
								</>
							) : (
								<>
									<Check className="h-4 w-4" />
									Appliquer
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
