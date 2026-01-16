import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
	return (
		<Drawer
			screenOptions={{
				headerShown: true, // shows header on top
				drawerType: "front", // standard drawer
			}}
		>
			{/* Accueil */}
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: "Accueil",
					drawerLabel: "Accueil",
					drawerIcon: ({ color, size }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>

			{/* Login */}
			<Drawer.Screen
				name="login"
				options={{
					headerTitle: "Login",
					drawerLabel: "Login",
					drawerIcon: ({ color, size }) => (
						<MaterialIcons name="login" size={size} color={color} />
					),
				}}
			/>
		</Drawer>
	);
}
