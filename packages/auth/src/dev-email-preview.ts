export interface DevVerificationPreview {
	email: string;
	url: string;
	createdAt: string;
}

type DevVerificationPreviewStore = Map<string, DevVerificationPreview>;

const globalForDevVerification = globalThis as typeof globalThis & {
	__RYTHMONS_DEV_VERIFICATION_PREVIEWS__?: DevVerificationPreviewStore;
};

function getStore(): DevVerificationPreviewStore {
	if (!globalForDevVerification.__RYTHMONS_DEV_VERIFICATION_PREVIEWS__) {
		globalForDevVerification.__RYTHMONS_DEV_VERIFICATION_PREVIEWS__ = new Map();
	}

	return globalForDevVerification.__RYTHMONS_DEV_VERIFICATION_PREVIEWS__;
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

export function saveDevVerificationPreview(email: string, url: string) {
	if (process.env.NODE_ENV === "production") {
		return;
	}

	getStore().set(normalizeEmail(email), {
		email,
		url,
		createdAt: new Date().toISOString(),
	});
}

export function getDevVerificationPreview(email: string) {
	if (process.env.NODE_ENV === "production") {
		return null;
	}

	return getStore().get(normalizeEmail(email)) ?? null;
}
