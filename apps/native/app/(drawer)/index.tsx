import { router } from "expo-router";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export default function Home() {
	const { data: session } = authClient.useSession();

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
				<View className="mb-6 gap-2">
					<Title className="text-3xl text-foreground">Accueil</Title>
					<Text className="text-muted-foreground">
						Decouvre des artistes et des lieux, puis propose une date.
					</Text>
				</View>

				{session?.user ? (
					<Card className="mb-6">
						<View className="mb-2 flex-row items-center justify-between">
							<Text className="text-base text-foreground">
								Bienvenue,{" "}
								<Text className="font-sans-medium">{session.user.name}</Text>
							</Text>
						</View>
						<Text className="mb-4 text-muted-foreground text-sm">
							{session.user.email}
						</Text>

						<TouchableOpacity
							onPress={() => {
								authClient.signOut();
								queryClient.invalidateQueries();
							}}
						>
							<Button label="Se deconnecter" variant="secondary" />
						</TouchableOpacity>
					</Card>
				) : null}

				{!session?.user ? (
					<Card className="mb-6">
						<Title className="mb-1 text-foreground text-xl">
							Accede a ton compte
						</Title>
						<Text className="mb-4 text-muted-foreground text-sm">
							Utilisez l’onglet « Connexion » pour vous connecter ou créer un
							compte.
						</Text>
						<Button
							label="Aller a Connexion"
							onPress={() => router.push("/(drawer)/login" as never)}
						/>
					</Card>
				) : null}
			</ScrollView>
		</Container>
	);
}
