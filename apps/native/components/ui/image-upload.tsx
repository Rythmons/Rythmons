import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	TouchableOpacity,
	View,
} from "react-native";
import { uploadImage } from "@/utils/uploadthing";
import { Text } from "./typography";

type AspectPreset = "auto" | "square" | "video";

export interface ImageUploadProps {
	value?: string;
	onChange: (url: string) => void;
	onRemove?: () => void;
	label?: string;
	aspectRatio?: AspectPreset;
	disabled?: boolean;
}

function inferMimeType(uri: string) {
	const lower = uri.toLowerCase();
	if (lower.endsWith(".png")) return "image/png";
	if (lower.endsWith(".webp")) return "image/webp";
	if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
	return "image/jpeg";
}

function inferFileName(uri: string) {
	const parts = uri.split("/");
	const last = parts[parts.length - 1];
	if (last?.includes(".")) return last;
	return `image-${Date.now()}.jpg`;
}

export function ImageUpload({
	value,
	onChange,
	onRemove,
	label = "Choisir une image",
	aspectRatio = "auto",
	disabled = false,
}: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);

	const pickerAspect: [number, number] | undefined = useMemo(() => {
		if (aspectRatio === "square") return [1, 1];
		if (aspectRatio === "video") return [16, 9];
		return undefined;
	}, [aspectRatio]);

	const pickAndUpload = useCallback(async () => {
		if (disabled || isUploading) return;

		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				"Permission requise",
				"Autorisez l’accès à la galerie pour sélectionner une image.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: Boolean(pickerAspect),
			aspect: pickerAspect,
			quality: 0.9,
		});

		if (result.canceled) return;
		const asset = result.assets?.[0];
		if (!asset?.uri) return;

		setIsUploading(true);
		try {
			const info = await FileSystem.getInfoAsync(asset.uri);
			const size =
				"size" in info && typeof info.size === "number" ? info.size : 0;

			const name = asset.fileName || inferFileName(asset.uri);
			const type = asset.mimeType || inferMimeType(asset.uri);

			const url = await uploadImage({
				uri: asset.uri,
				name,
				type,
				size,
				lastModified: Date.now(),
			});

			onChange(url);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Erreur lors de l’upload de l’image";
			Alert.alert("Erreur", message);
		} finally {
			setIsUploading(false);
		}
	}, [disabled, isUploading, onChange, pickerAspect]);

	if (value) {
		return (
			<View className="overflow-hidden rounded-xl border border-border bg-card">
				<View className="relative">
					<Image
						source={{ uri: value }}
						className={aspectRatio === "square" ? "h-40 w-full" : "h-44 w-full"}
						resizeMode="cover"
					/>
					<View className="absolute top-3 right-3 flex-row gap-2">
						<TouchableOpacity
							className="rounded-lg bg-black/50 px-3 py-2"
							onPress={pickAndUpload}
							disabled={disabled || isUploading}
						>
							{isUploading ? (
								<ActivityIndicator color="white" />
							) : (
								<View className="flex-row items-center">
									<Ionicons name="pencil" size={16} color="white" />
									<Text className="ml-2 text-white">Remplacer</Text>
								</View>
							)}
						</TouchableOpacity>
						{onRemove ? (
							<TouchableOpacity
								className="rounded-lg bg-destructive/80 px-3 py-2"
								onPress={onRemove}
								disabled={disabled || isUploading}
							>
								<View className="flex-row items-center">
									<Ionicons name="trash" size={16} color="white" />
									<Text className="ml-2 text-white">Supprimer</Text>
								</View>
							</TouchableOpacity>
						) : null}
					</View>
				</View>
			</View>
		);
	}

	return (
		<TouchableOpacity
			className="flex-row items-center justify-center rounded-xl border border-border bg-card p-4"
			onPress={pickAndUpload}
			disabled={disabled || isUploading}
		>
			{isUploading ? (
				<ActivityIndicator style={{ marginRight: 8 }} />
			) : (
				<Ionicons
					name="cloud-upload-outline"
					size={18}
					color="#9ca3af"
					style={{ marginRight: 8 }}
				/>
			)}
			<Text className="text-muted-foreground">
				{isUploading ? "Upload en cours…" : label}
			</Text>
		</TouchableOpacity>
	);
}
