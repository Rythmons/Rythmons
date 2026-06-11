"use client";

import { BoomBox } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function MediaProfilePage() {
	const router = useRouter();

	return (
		<div className="min-h-screen">
			<div className="container mx-auto max-w-3xl px-4 py-16">
				<div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
					<div className="flex items-start gap-4">
						<div className="rounded-xl bg-primary/20 p-3">
							<BoomBox className="h-8 w-8 text-primary" />
						</div>
						<div>
							<h1 className="mb-2 font-bold text-3xl">
								Profils médias (bientôt)
							</h1>
							<p className="text-lg text-muted-foreground">
								Les profils médias font partie d&apos;Epic 4 et ne sont pas
								encore disponibles.
							</p>
						</div>
					</div>
				</div>

				<div className="mt-6 flex flex-wrap gap-3">
					<Button onClick={() => router.push("/")}>
						Retour à l&apos;accueil
					</Button>
					<Button variant="outline" onClick={() => router.back()}>
						Page précédente
					</Button>
				</div>
			</div>
		</div>
	);
}
