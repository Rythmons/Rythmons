import { View } from "react-native";
import { Text } from "@/components/ui/typography";

type SessionRole = "ARTIST" | "ORGANIZER" | "BOTH" | null | undefined;

function labelForRole(role: SessionRole) {
	switch (role) {
		case "ARTIST":
			return "Artiste";
		case "ORGANIZER":
			return "Organisateur / Lieu";
		case "BOTH":
			return "Artiste + Organisateur";
		default:
			return "Plus tard";
	}
}

export function RolePill({
	role,
	className,
}: {
	role: SessionRole;
	className?: string;
}) {
	return (
		<View className={className ?? ""}>
			<View className="self-start rounded-full bg-muted px-3 py-2">
				<Text className="font-sans-medium text-foreground text-xs">
					Mode: {labelForRole(role)}
				</Text>
			</View>
		</View>
	);
}
