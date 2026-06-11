export function HomeHeroAnimation() {
	return (
		<div
			className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#17001E] via-[#210021] to-[#0B000E] shadow-2xl shadow-black/40"
			aria-hidden
		>
			{/* Ambient moving blobs */}
			<div className="pointer-events-none absolute inset-0">
				<div className="home-blob home-blob-1" />
				<div className="home-blob home-blob-2" />
				<div className="home-blob home-blob-3" />
				<div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_20%,rgba(235,13,65,0.18),transparent_65%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_80%,rgba(128,0,59,0.12),transparent_60%)]" />
				<div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.65))]" />
			</div>

			{/* Fake UI card */}
			<div className="absolute inset-0 flex items-center justify-center p-4 sm:p-10">
				<div className="home-ui w-full max-w-md rounded-2xl border border-white/10 bg-black/35 p-6 backdrop-blur-sm sm:p-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5" />
							<div className="space-y-1.5">
								<div className="h-2.5 w-32 rounded-full bg-white/10" />
								<div className="h-2 w-24 rounded-full bg-white/10" />
							</div>
						</div>
						<div className="h-8 w-20 rounded-full bg-[color:var(--brand-primary)]/20 ring-1 ring-[color:var(--brand-primary)]/30" />
					</div>

					<div className="mt-6 grid grid-cols-7 gap-2">
						{Array.from({ length: 21 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: static demo grid
								key={i}
								className={[
									"relative h-9 rounded-lg border border-white/10 bg-white/5",
									i === 3 || i === 10 || i === 16
										? "bg-[color:var(--brand-primary)]/10 ring-1 ring-[color:var(--brand-primary)]/40"
										: "",
								].join(" ")}
							>
								{i === 10 ? (
									<div className="absolute inset-x-2 top-2 h-1.5 rounded-full bg-[color:var(--brand-primary)]/80" />
								) : null}
							</div>
						))}
					</div>

					<div className="mt-6 space-y-3">
						<div className="home-row flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
							<div className="h-8 w-8 rounded-lg bg-[color:var(--brand-primary)]/20 ring-1 ring-[color:var(--brand-primary)]/30" />
							<div className="flex-1 space-y-2">
								<div className="h-2.5 w-40 rounded-full bg-white/10" />
								<div className="h-2 w-28 rounded-full bg-white/10" />
							</div>
							<div className="h-6 w-14 rounded-full bg-white/10" />
						</div>
						<div className="home-row home-row-delay flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
							<div className="h-8 w-8 rounded-lg bg-white/10" />
							<div className="flex-1 space-y-2">
								<div className="h-2.5 w-44 rounded-full bg-white/10" />
								<div className="h-2 w-24 rounded-full bg-white/10" />
							</div>
							<div className="h-6 w-12 rounded-full bg-white/10" />
						</div>
					</div>

					{/* Shimmer sweep */}
					<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
						<div className="home-shimmer" />
					</div>
				</div>
			</div>
		</div>
	);
}
