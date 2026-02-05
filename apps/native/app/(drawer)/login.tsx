import { Text, View } from "react-native";
import { Login } from "@/components/login/login"; // your Login component with SignIn/SignUp/ForgotPassword

export default function LoginScreen() {
	return (
		<View className="flex-1">
			<Login />
		</View>
	);
}
