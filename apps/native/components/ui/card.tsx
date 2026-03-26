import type { ReactNode } from "react";
import { View } from "react-native";
import { cn } from "@/lib/cn";

export function Card({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<View
			className={cn(
				"rounded-2xl border border-border bg-card p-4 shadow-card",
				className,
			)}
		>
			{children}
		</View>
	);
}
