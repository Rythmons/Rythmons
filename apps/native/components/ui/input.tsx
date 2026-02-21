import { forwardRef } from "react";
import { TextInput as RNTextInput, type TextInputProps } from "react-native";

export const Input = forwardRef<
	RNTextInput,
	TextInputProps & { className?: string }
>(({ className, ...props }, ref) => {
	return (
		<RNTextInput
			ref={ref}
			className={`font-sans text-foreground ${className || ""}`}
			{...props}
		/>
	);
});

Input.displayName = "Input";
