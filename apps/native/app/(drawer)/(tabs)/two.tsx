import { ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";

export default function TabTwo() {
	return (
		<Container>
			<ScrollView className="flex-1 p-6">
				<View className="py-8">
					<Text className="mb-2 font-bold text-3xl text-foreground">
						Onglet Deux
					</Text>
					<Text className="text-lg text-muted-foreground">
						Découvrez plus de fonctionnalités et de contenu
					</Text>
				</View>
			</ScrollView>
		</Container>
	);
}
