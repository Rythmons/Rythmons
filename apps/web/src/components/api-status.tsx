"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export function ApiStatus() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className="flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1 text-xs">
			<div
				className={`h-1.5 w-1.5 rounded-full ${
					healthCheck.isLoading
						? "bg-zinc-500"
						: healthCheck.data
							? "bg-green-500"
							: "bg-red-500"
				} animate-pulse`}
			/>
			<span className="text-muted-foreground">
				{healthCheck.isLoading
					? "API Vérification..."
					: healthCheck.data
						? "API Connectée"
						: "API Déconnectée"}
			</span>
		</div>
	);
}
