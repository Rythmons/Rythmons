import type { ReactNode } from "react";
import { View } from "react-native";
import { cn } from "@/lib/cn";
import { Text } from "./typography";

type FieldProps = {
	label?: string;
	error?: string | null;
	hint?: string | null;
	children: ReactNode;
	className?: string;
};

export function Field({ label, error, hint, children, className }: FieldProps) {
	return (
		<View className={cn("gap-1.5", className)}>
			{label ? (
				<Text className="font-sans-medium text-foreground text-sm">
					{label}
				</Text>
			) : null}
			{children}
			{error ? (
				<Text className="text-destructive text-xs">{error}</Text>
			) : hint ? (
				<Text className="text-muted-foreground text-xs">{hint}</Text>
			) : null}
		</View>
	);
}
