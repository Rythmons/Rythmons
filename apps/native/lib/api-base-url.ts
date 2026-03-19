import Constants from "expo-constants";

function getHostFromValue(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	const normalizedValue = trimmedValue.replace(/^https?:\/\//, "");
	const host = normalizedValue.split("/")[0]?.split(":")[0];

	return host || null;
}

function getExpoDevHost() {
	const constants = Constants as typeof Constants & {
		expoGoConfig?: { debuggerHost?: string | null };
		manifest2?: {
			extra?: {
				expoClient?: { hostUri?: string | null };
			};
		};
		manifest?: { debuggerHost?: string | null };
	};

	return (
		getHostFromValue(constants.expoGoConfig?.debuggerHost) ??
		getHostFromValue(constants.manifest2?.extra?.expoClient?.hostUri) ??
		getHostFromValue(constants.manifest?.debuggerHost) ??
		null
	);
}

export function getApiBaseUrl() {
	const configuredUrl = process.env.EXPO_PUBLIC_SERVER_URL?.trim();

	if (!__DEV__) {
		return configuredUrl || "";
	}

	const devHost = getExpoDevHost();
	if (devHost) {
		return `http://${devHost}:3000`;
	}

	return configuredUrl || "http://127.0.0.1:3000";
}
