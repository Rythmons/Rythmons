import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/tabbar-icon";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function TabLayout() {
	const { isDarkColorScheme } = useColorScheme();

	const headerBackground = isDarkColorScheme
		? "hsl(222.2 84% 4.9%)"
		: "hsl(0 0% 100%)";
	const headerTint = isDarkColorScheme
		? "hsl(215 20.2% 65.1%)"
		: "hsl(215.4 16.3% 46.9%)";

	return (
		<Tabs
			screenOptions={{
				headerTitleAlign: "center",
				headerStyle: {
					backgroundColor: headerBackground,
				},
				headerTintColor: headerTint,
				headerTitleStyle: {
					color: isDarkColorScheme
						? "hsl(217.2 91.2% 59.8%)"
						: "hsl(221.2 83.2% 53.3%)",
				},
				tabBarHideOnKeyboard: true,
				tabBarActiveTintColor: isDarkColorScheme
					? "hsl(217.2 91.2% 59.8%)"
					: "hsl(221.2 83.2% 53.3%)",
				tabBarInactiveTintColor: headerTint,
				tabBarStyle: {
					backgroundColor: headerBackground,
					borderTopColor: isDarkColorScheme
						? "hsl(217.2 32.6% 17.5%)"
						: "hsl(214.3 31.8% 91.4%)",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Accueil",
					tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="auth"
				options={{
					title: "Authentification",
					tabBarIcon: ({ color }) => (
						<TabBarIcon name="user-circle-o" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: "Tableau de bord",
					tabBarIcon: ({ color }) => (
						<TabBarIcon name="bar-chart" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
