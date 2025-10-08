import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { Container } from "@/components/container";
import { Loader } from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import { useSignOut } from "@/lib/use-sign-out";
import { trpc } from "@/utils/trpc";

export default function DashboardScreen() {
	const { data: session, isPending } = authClient.useSession();

	const privateDataQuery = useQuery({
		...trpc.privateData.queryOptions(),
		enabled: Boolean(session?.user),
		refetchOnMount: "always",
	});

	const { signOut, isSigningOut } = useSignOut();

	if (isPending) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Loader label="Chargement de la session…" />
				</View>
			</Container>
		);
	}

	if (!session?.user) {
		return (
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Text className="mb-2 text-center font-semibold text-2xl text-foreground">
						Tableau de bord
					</Text>
					<Text className="text-center text-muted-foreground">
						Connectez-vous ou créez un compte depuis l’onglet Accueil pour
						consulter vos informations privées.
					</Text>
				</View>
			</Container>
		);
	}

	const displayName =
		session.user.name ?? session.user.email ?? "Utilisateur Rythmons";

	return (
		<Container>
			<ScrollView className="flex-1">
				<View className="gap-6 px-4 py-8">
					<View className="rounded-lg border border-border bg-card p-4">
						<Text className="mb-1 font-semibold text-foreground text-lg">
							Bienvenue, {displayName}
						</Text>
						{session.user.email ? (
							<Text className="text-muted-foreground text-sm">
								{session.user.email}
							</Text>
						) : null}
					</View>

					<View className="rounded-lg border border-border bg-card p-4">
						<Text className="mb-2 font-medium text-foreground">
							Message privé de l’API
						</Text>
						{privateDataQuery.isLoading ? (
							<Loader label="Récupération en cours…" size="small" />
						) : privateDataQuery.isError ? (
							<Text className="text-destructive text-sm">
								Impossible de charger le message confidentiel. Vérifiez votre
								connexion.
							</Text>
						) : (
							<Text className="text-muted-foreground">
								{(privateDataQuery.data as { message?: string } | undefined)
									?.message ?? ""}
							</Text>
						)}
					</View>

					<View className="rounded-lg border border-border bg-card p-4">
						<Text className="mb-2 font-medium text-foreground">
							Gestion de session
						</Text>
						<Text className="mb-4 text-muted-foreground">
							Vous pouvez vous déconnecter pour changer de compte.
						</Text>
						<TouchableOpacity
							onPress={signOut}
							disabled={isSigningOut}
							className="self-start rounded-md bg-destructive px-4 py-2 disabled:opacity-70"
						>
							<Text className="font-medium text-destructive-foreground">
								{isSigningOut ? "Déconnexion…" : "Se déconnecter"}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</Container>
	);
}
