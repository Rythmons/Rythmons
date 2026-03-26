import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export default function Home() {
	const { data: session } = authClient.useSession();

	return (
		<Container>
			<ScrollView className="flex-1">
				<View className="px-4">
					<Text className="mb-4 font-bold font-mono text-3xl text-foreground">
						ACCUEIL
					</Text>

					{session?.user ? (
						<View className="mb-6 rounded-lg border border-border bg-card p-4">
							<View className="mb-2 flex-row items-center justify-between">
								<Text className="text-base text-foreground">
									Bienvenue,{" "}
									<Text className="font-medium">{session.user.name}</Text>
								</Text>
							</View>
							<Text className="mb-4 text-muted-foreground text-sm">
								{session.user.email}
							</Text>

							<TouchableOpacity
								className="self-start rounded-md bg-destructive px-4 py-2"
								onPress={() => {
									authClient.signOut();
									queryClient.invalidateQueries();
								}}
							>
								<Text className="font-medium text-white">Se déconnecter</Text>
							</TouchableOpacity>
						</View>
					) : null}

					{!session?.user ? (
						<View className="mb-6 rounded-lg border border-border bg-card p-4">
							<Text className="mb-2 font-semibold text-base text-foreground">
								Accédez à votre compte
							</Text>
							<Text className="mb-4 text-muted-foreground text-sm">
								Utilisez l’onglet « Connexion » pour vous connecter ou créer un
								compte.
							</Text>
							<TouchableOpacity
								className="self-start rounded-md bg-primary px-4 py-2"
								onPress={() => router.push("/(drawer)/login" as never)}
							>
								<Text className="font-medium text-primary-foreground">
									Aller à Connexion
								</Text>
							</TouchableOpacity>
						</View>
					) : null}
				</View>
			</ScrollView>
		</Container>
	);
}
