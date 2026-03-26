import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

// Custom Text component that applies Montserrat font globally
export function Text({
	className,
	...props
}: TextProps & { className?: string }) {
	return (
		<RNText className={cn("font-sans text-foreground", className)} {...props} />
	);
}

// Title: keep headings clean & readable (Montserrat).
export function Title({
	className,
	...props
}: TextProps & { className?: string }) {
	return (
		<RNText
			className={cn("font-sans-bold text-foreground", className)}
			{...props}
		/>
	);
}

// Display: brand font (use sparingly, e.g. logo / special hero moments).
export function Display({
	className,
	...props
}: TextProps & { className?: string }) {
	return (
		<RNText
			className={cn("font-display text-foreground", className)}
			{...props}
		/>
	);
}
