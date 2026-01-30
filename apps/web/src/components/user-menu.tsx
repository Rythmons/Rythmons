import { useAuth } from "@rythmons/auth/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, LogOut, Mic2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
	const router = useRouter();
	const authClient = useAuth();
	const { data: session, isPending } = authClient.useSession();

	// Fetch Artists and Venues for the menu
	const { data: artists } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: !!session?.user,
	});

	const { data: venues } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: !!session?.user,
	});

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link href="/login">Se connecter</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="relative h-10 w-full justify-start gap-2 overflow-hidden bg-card p-0 pr-4 text-left shadow-sm hover:bg-accent sm:w-auto"
				>
					{/* Default state: Show User Info (or maybe the first profile?) */}
					{/* For now, replicating the 'User' state styled like a profile */}
					<div className="flex h-full items-center">
						<div className="flex h-full w-12 items-center justify-center bg-zinc-800 font-bold text-[10px] text-white">
							UTIL.
						</div>
						<div className="ml-3 flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
								{session.user.image ? (
									<img
										src={session.user.image}
										alt={session.user.name}
										className="h-full w-full rounded-full object-cover"
									/>
								) : (
									<User className="h-4 w-4" />
								)}
							</div>
							<span className="font-semibold">{session.user.name}</span>
						</div>
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-64 bg-black p-0 text-white" align="end">
				{/* PROFILES LIST */}
				<div className="flex flex-col">
					{/* Artists */}
					{(artists as any[])?.map((artist) => (
						<Link
							key={artist.id}
							href={`/dashboard/artist?id=${artist.id}`}
							className="group relative flex h-14 w-full cursor-pointer items-center overflow-hidden border-white/10 border-b transition-colors hover:bg-white/5"
						>
							{/* Tag */}
							<div className="flex h-full w-12 items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600 font-bold text-[10px] text-white">
								INDÉ
							</div>
							{/* Content */}
							<div className="ml-3 flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800">
									{/* Placeholder for Artist Image */}
									<Mic2 className="h-4 w-4 text-zinc-400" />
								</div>
								<span className="font-bold text-sm tracking-wide">
									{artist.stageName}
								</span>
							</div>
						</Link>
					))}

					{/* Venues */}
					{(venues as any[])?.map((venue) => (
						<Link
							key={venue.id}
							href={`/venue/${venue.id}` as any}
							className="group relative flex h-14 w-full cursor-pointer items-center overflow-hidden border-white/10 border-b transition-colors hover:bg-white/5"
						>
							{/* Tag */}
							<div className="flex h-full w-12 items-center justify-center bg-gradient-to-br from-red-600 to-orange-600 font-bold text-[10px] text-white">
								PRO
							</div>
							{/* Content */}
							<div className="ml-3 flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
									{venue.logoUrl ? (
										<img
											src={venue.logoUrl}
											alt={venue.name}
											className="h-full w-full rounded-lg object-cover"
										/>
									) : (
										<Building2 className="h-4 w-4 text-zinc-400" />
									)}
								</div>
								<span className="font-bold text-sm tracking-wide">
									{venue.name}
								</span>
							</div>
						</Link>
					))}
				</div>

				<DropdownMenuSeparator className="bg-white/10" />

				{/* Logout Option */}
				<DropdownMenuItem
					className="flex cursor-pointer items-center gap-2 p-4 text-zinc-400 hover:text-white focus:bg-white/5 focus:text-white"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									router.push("/");
								},
							},
						});
					}}
				>
					<LogOut className="h-4 w-4" />
					<span>Se déconnecter</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
