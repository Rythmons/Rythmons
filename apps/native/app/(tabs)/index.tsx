import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { trpc } from "@/utils/trpc";

export default function HomeScreen() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<Container>
			<ScrollView className="flex-1">
				<View className="gap-6 px-4 py-6">
					<View className="rounded-lg border border-border p-4">
						<Text className="mb-3 font-medium text-foreground">
							Statut de l’API
						</Text>
						<View className="flex-row items-center gap-2">
							<View
								className={`h-3 w-3 rounded-full ${healthCheck.data ? "bg-green-500" : healthCheck.isLoading ? "bg-yellow-400" : "bg-red-500"}`}
							/>
							<Text className="text-muted-foreground">
								{healthCheck.isLoading
									? "Vérification en cours…"
									: healthCheck.data
										? "Connecté"
										: "Déconnecté"}
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</Container>
	);
}
