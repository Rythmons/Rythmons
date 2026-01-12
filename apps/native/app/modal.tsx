import { View } from "react-native";
import { Container } from "@/components/container";
import { Title } from "@/components/ui/typography";

export default function Modal() {
	return (
		<Container>
			<View className="flex-1 p-6">
				<View className="mb-8 flex-row items-center justify-between">
					<Title className="text-2xl text-foreground">Modale</Title>
				</View>
			</View>
		</Container>
	);
}
