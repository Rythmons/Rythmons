import { forwardRef } from "react";
import { TextInput as RNTextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";

type InputVariant = "default" | "error";

export const Input = forwardRef<
	RNTextInput,
	TextInputProps & { className?: string; variant?: InputVariant }
>(({ className, variant = "default", ...props }, ref) => {
	return (
		<RNTextInput
			ref={ref}
			className={cn(
				"min-h-12 rounded-xl border bg-input px-4 py-3 font-sans text-foreground",
				"border-input",
				"focus:border-primary",
				variant === "error" && "border-destructive",
				className,
			)}
			{...props}
		/>
	);
});

Input.displayName = "Input";
