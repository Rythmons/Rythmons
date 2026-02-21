import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
	return (
		<Drawer
			screenOptions={{
				headerShown: true, // shows header on top
				drawerType: "front", // standard drawer
				headerTitleStyle: {
					fontFamily: "FugazOne-Regular",
				},
				drawerLabelStyle: {
					fontFamily: "Montserrat-Regular",
				},
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

			<Drawer.Screen
				name="profile"
				options={{
					headerTitle: "Mon Profil",
					drawerLabel: "Mon Profil",
					drawerIcon: ({ color, size }) => (
						<Ionicons name="person-circle-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="artist"
				options={{
					headerTitle: "Mes Artistes",
					drawerLabel: "Mes Artistes",
					drawerIcon: ({ color, size }) => (
						<Ionicons name="musical-notes-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="venue"
				options={{
					headerTitle: "Mon Lieu",
					drawerLabel: "Mon Lieu",
					drawerIcon: ({ color, size }) => (
						<Ionicons name="business-outline" size={size} color={color} />
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

			<Drawer.Screen
				name="(tabs)"
				options={{
					drawerItemStyle: { display: "none" },
				}}
			/>
		</Drawer>
	);
}
