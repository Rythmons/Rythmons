import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";

const DrawerLayout = () => {
	return (
		<Drawer
			screenOptions={{
				headerTitleStyle: {
					fontFamily: "FugazOne-Regular",
				},
				drawerLabelStyle: {
					fontFamily: "Montserrat-Regular",
				},
			}}
		>
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
				name="profile"
				options={{
					headerTitle: "Mon Profil",
					drawerLabel: "Mon Profil",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="person-circle-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="venue"
				options={{
					headerTitle: "Mon Lieu",
					drawerLabel: "Mon Lieu",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="business-outline" size={size} color={color} />
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
};

export default DrawerLayout;
