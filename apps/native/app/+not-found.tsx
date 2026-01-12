import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Container } from "@/components/container";
import { Text, Title } from "@/components/ui/typography";

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "Oups !" }} />
			<Container>
				<View className="flex-1 items-center justify-center p-6">
					<View className="items-center">
						<Text className="mb-4 text-6xl">🤔</Text>
						<Title className="mb-2 text-center text-2xl text-foreground">
							Page non trouvée
						</Title>
						<Text className="mb-8 max-w-sm text-center text-muted-foreground">
							Désolé, la page que vous recherchez n'existe pas.
						</Text>
						<Link href="/" asChild>
							<Text className="rounded-lg bg-primary/10 px-6 py-3 font-sans-medium text-primary">
								Aller à l'accueil
							</Text>
						</Link>
					</View>
				</View>
			</Container>
		</>
	);
}
