import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder. Always pass explicit height/width (e.g. h-10 w-48 or min-h-[...])
 * so that when content loads there is no layout shift (CLS).
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-accent", className)}
			{...props}
		/>
	);
}

export { Skeleton };
