import { forwardRef } from "react";
import { TextInput as RNTextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";

type InputVariant = "default" | "error";

export const Input = forwardRef<
	RNTextInput,
	TextInputProps & { className?: string; variant?: InputVariant }
>(({ className, variant = "default", ...props }, ref) => {
	const isMultiline = props.multiline === true;
	return (
		<RNTextInput
			ref={ref}
			className={cn(
				"rounded-xl border bg-input px-4 py-3 font-sans text-foreground",
				isMultiline ? "min-h-24" : "min-h-12",
				"border-input",
				"focus:border-primary",
				variant === "error" && "border-destructive",
				className,
			)}
			textAlignVertical={isMultiline ? "top" : props.textAlignVertical}
			{...props}
		/>
	);
});

Input.displayName = "Input";
