import { ActivityIndicator, Text, View } from "react-native";

export function Loader({
	label,
	size = "large",
}: {
	label?: string;
	size?: "small" | "large";
}) {
	return (
		<View className="flex-row items-center justify-center gap-3">
			<ActivityIndicator size={size} />
			{label ? <Text className="text-muted-foreground">{label}</Text> : null}
		</View>
	);
}
