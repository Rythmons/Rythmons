import { Text as RNText, type TextProps } from "react-native";

// Custom Text component that applies Montserrat font globally
export function Text({
	className,
	...props
}: TextProps & { className?: string }) {
	return (
		<RNText
			className={`font-sans text-foreground ${className || ""}`}
			{...props}
		/>
	);
}

// Custom Title component that applies Fugaz One font for headings
export function Title({
	className,
	...props
}: TextProps & { className?: string }) {
	return (
		<RNText
			className={`font-display text-foreground ${className || ""}`}
			{...props}
		/>
	);
}
