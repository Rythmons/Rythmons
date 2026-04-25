"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NavbarSearchProps = {
	onAfterNavigate?: () => void;
	className?: string;
};

/**
 * Barre de recherche globale (Epic 3) : envoie vers `/dashboard/search?q=…`
 * et reste synchronisée avec l’URL sur cette page.
 */
export function NavbarSearch({
	onAfterNavigate,
	className,
}: NavbarSearchProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const onSearchPage = pathname.startsWith("/dashboard/search");
	const qFromUrl = onSearchPage ? (searchParams.get("q") ?? "") : "";
	const [value, setValue] = useState(qFromUrl);

	useEffect(() => {
		setValue(qFromUrl);
	}, [qFromUrl]);

	function submit(next: string) {
		const trimmed = next.trim();
		const params = new URLSearchParams(
			onSearchPage ? searchParams.toString() : "",
		);
		if (trimmed) {
			params.set("q", trimmed);
		} else {
			params.delete("q");
		}
		const qs = params.toString();
		router.push(`/dashboard/search${qs ? `?${qs}` : ""}` as Route);
		onAfterNavigate?.();
	}

	return (
		<search
			className={cn("mx-1 flex min-w-0 max-w-xl flex-1 sm:mx-2", className)}
		>
			<form
				className="flex min-w-0 flex-1 flex-row items-center gap-1"
				onSubmit={(e) => {
					e.preventDefault();
					submit(value);
				}}
			>
				<div className="relative min-w-0 flex-1">
					<Input
						type="search"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="Lieux, artistes…"
						className="h-9 min-w-0 border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/35 focus-visible:ring-[color:var(--brand-primary)]"
						aria-label="Recherche Rythmons"
						autoComplete="off"
					/>
				</div>
				<Button
					type="submit"
					size="sm"
					className="h-9 shrink-0 bg-[color:var(--brand-primary)] px-2 text-white hover:brightness-110 sm:px-3"
					aria-label="Rechercher"
				>
					<Search className="h-4 w-4" aria-hidden />
					<span className="hidden sm:inline">Rechercher</span>
				</Button>
			</form>
		</search>
	);
}
