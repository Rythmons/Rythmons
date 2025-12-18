import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { HeaderButton } from "@/components/header-button";

const DrawerLayout = () => {
	return (
		<Drawer>
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: "Accueil",
					drawerLabel: "Accueil",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="(tabs)"
				options={{
					headerTitle: "Onglets",
					drawerLabel: "Onglets",
					drawerIcon: ({ size, color }) => (
						<MaterialIcons name="border-bottom" size={size} color={color} />
					),
					headerRight: () => (
						<Link href="/modal" asChild>
							<HeaderButton />
						</Link>
					),
				}}
			/>
		</Drawer>
	);
};

export default DrawerLayout;
