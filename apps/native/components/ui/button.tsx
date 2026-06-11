import {
	ActivityIndicator,
	type GestureResponderEvent,
	TouchableOpacity,
} from "react-native";
import { cn } from "@/lib/cn";
import { Text } from "./typography";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
	label: string;
	onPress?: (event: GestureResponderEvent) => void;
	disabled?: boolean;
	loading?: boolean;
	variant?: ButtonVariant;
	className?: string;
	textClassName?: string;
};

export function Button({
	label,
	onPress,
	disabled,
	loading,
	variant = "primary",
	className,
	textClassName,
}: ButtonProps) {
	const isDisabled = disabled || loading;

	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={isDisabled}
			activeOpacity={0.88}
			className={cn(
				"min-h-12 flex-row items-center justify-center rounded-xl px-4",
				variant === "primary" && "bg-primary",
				variant === "secondary" && "border border-border bg-card",
				variant === "ghost" && "bg-transparent",
				isDisabled && "opacity-60",
				className,
			)}
		>
			{loading ? (
				<ActivityIndicator
					size="small"
					color={variant === "primary" ? "white" : "#EA0D40"}
				/>
			) : (
				<Text
					className={cn(
						"font-sans-bold text-base",
						variant === "primary" && "text-primary-foreground",
						variant !== "primary" && "text-foreground",
						textClassName,
					)}
				>
					{label}
				</Text>
			)}
		</TouchableOpacity>
	);
}
