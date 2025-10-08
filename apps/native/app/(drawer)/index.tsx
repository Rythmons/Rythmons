import { Redirect } from "expo-router";

export default function LegacyDrawerIndexRedirect() {
	return <Redirect href="/(tabs)" />;
}
