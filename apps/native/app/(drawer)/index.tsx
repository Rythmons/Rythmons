import { useQuery } from "@tanstack/react-query";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { Text, Title } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

export default function Home() {
	const { data: session } = authClient.useSession();
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const privateData = useQuery({
		...trpc.privateData.queryOptions(),
		enabled: !!session?.user,
	});

	return (
		<Container>
			<ScrollView className="flex-1">
				<View className="px-4">
					<Title className="mb-4 text-3xl text-foreground">
						BETTER T STACK
					</Title>
					{session?.user ? (
						<View className="mb-6 rounded-lg border border-border bg-card p-4">
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
								className="self-start rounded-md bg-destructive px-4 py-2"
								onPress={() => {
									authClient.signOut();
									queryClient.invalidateQueries();
								}}
							>
								<Text className="font-sans-medium text-white">
									Se déconnecter
								</Text>
							</TouchableOpacity>
						</View>
					) : null}
					<View className="mb-6 rounded-lg border border-border p-4">
						<Text className="mb-3 font-sans-medium text-foreground">
							État de l'API
						</Text>
						<View className="flex-row items-center gap-2">
							<View
								className={`h-3 w-3 rounded-full ${
									healthCheck.data ? "bg-green-500" : "bg-red-500"
								}`}
							/>
							<Text className="text-muted-foreground">
								{healthCheck.isLoading
									? "Vérification..."
									: healthCheck.data
										? "Connecté à l'API"
										: `API Déconnectée : ${healthCheck.error?.message ?? "Inconnu"}`}
							</Text>
							<Text className="mt-1 text-muted-foreground text-xs">
								URL: {process.env.EXPO_PUBLIC_SERVER_URL}
							</Text>
						</View>
					</View>
					<View className="mb-6 rounded-lg border border-border p-4">
						<Text className="mb-3 font-sans-medium text-foreground">
							Données Privées
						</Text>
						{privateData && (
							<View>
								<Text className="text-muted-foreground">
									{privateData.data?.message}
								</Text>
							</View>
						)}
					</View>
					{!session?.user && (
						<>
							<SignIn />
							<SignUp />
						</>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}
