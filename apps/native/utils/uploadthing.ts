import { genUploader } from "uploadthing/client";

export type ReactNativeUploadFile = {
	uri: string;
	name: string;
	type: string;
	size: number;
	lastModified?: number;
};

function joinUrl(base: string, path: string) {
	return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "";
const uploadthingUrl = serverUrl
	? joinUrl(serverUrl, "/api/uploadthing")
	: "/api/uploadthing";

const uploader = genUploader({
	url: uploadthingUrl,
	package: "native",
});

export async function uploadImage(file: ReactNativeUploadFile) {
	const res = await uploader.uploadFiles("imageUploader", {
		files: [file as unknown as File],
	});

	const first = res?.[0];
	const url = first?.ufsUrl || first?.url || first?.serverData?.url;
	if (!url) {
		throw new Error("Upload terminé, mais URL manquante.");
	}
	return url;
}
