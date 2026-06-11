import { useAuth } from "@rythmons/auth/client";
import { useQuery } from "@tanstack/react-query";
import {
	Building2,
	LogOut,
	MessageCircle,
	Mic2,
	Search,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

type ArtistMenuItem = {
	id: string;
	stageName: string;
	photoUrl?: string | null;
};

type VenueMenuItem = {
	id: string;
	name: string;
	logoUrl?: string | null;
};

export default function UserMenu() {
	const router = useRouter();
	const authClient = useAuth();
	const { data: session, isPending } = authClient.useSession();
	const sessionRole = (session?.user as { role?: string | null } | undefined)
		?.role;
	const hasArtistRole = sessionRole === "ARTIST" || sessionRole === "BOTH";
	const hasOrganizerRole =
		sessionRole === "ORGANIZER" || sessionRole === "BOTH";

	// Fetch Artists and Venues for the menu
	const { data: artists } = useQuery({
		...trpc.artist.myArtists.queryOptions(),
		enabled: !!session?.user,
	});

	const { data: venues } = useQuery({
		...trpc.venue.getMyVenues.queryOptions(),
		enabled: !!session?.user,
	});
	const artistItems = (artists ?? []) as ArtistMenuItem[];
	const venueItems = (venues ?? []) as VenueMenuItem[];
	const canSearchVenues = hasArtistRole || artistItems.length > 0;
	const canSearchArtists = hasOrganizerRole || venueItems.length > 0;
	const canUseSearch = canSearchVenues || canSearchArtists;

	// Fetch conversations to display unread notifications and badge
	const { data: conversations = [] } = useQuery({
		...trpc.conversation.getAll.queryOptions(),
		enabled: !!session?.user,
		refetchInterval: 5000,
	});

	const unreadConversations = (conversations as any[]).filter(
		(c) => (c.unreadCount ?? 0) > 0,
	);
	const totalUnread = unreadConversations.reduce(
		(sum, c) => sum + (c.unreadCount ?? 0),
		0,
	);

	if (isPending) {
		return <Skeleton className="h-10 w-24" />;
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
									/* biome-ignore lint/performance/noImgElement: menu avatars use uploaded remote URLs */
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
					{/* Red dot indicator for unread messages */}
					{totalUnread > 0 ? (
						<span className="pointer-events-none absolute top-1 right-2 h-2 w-2 rounded-full bg-red-600" />
					) : null}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-64 bg-black p-0 text-white" align="end">
				{/* Unread notifications list */}
				{unreadConversations.length > 0 ? (
					<div className="flex flex-col">
						{(unreadConversations as any[]).slice(0, 5).map((conv) => (
							<DropdownMenuItem
								key={conv.id}
								className="flex cursor-pointer items-center gap-2 p-3 text-white hover:bg-white/5"
								onClick={() => {
									router.push(`/messages?conversationId=${conv.id}`);
								}}
							>
								<MessageCircle className="h-4 w-4" />
								<div className="flex-1 text-left">
									<div className="truncate font-semibold text-sm">
										{(conv.participants || []).find((p: any) => p.name)?.name ||
											"Nouvel message"}
									</div>
									<div className="text-xs opacity-80">
										{conv.unreadCount} non lu{conv.unreadCount > 1 ? "s" : ""}
									</div>
								</div>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator className="bg-white/10" />
					</div>
				) : null}
				{/* PROFILES LIST */}
				<div className="flex flex-col">
					{/* Artists */}
					{artistItems.map((artist) => (
						<Link
							key={artist.id}
							href={`/artist/${artist.id}`}
							className="group relative flex h-14 w-full cursor-pointer items-center overflow-hidden border-white/10 border-b transition-colors hover:bg-white/5"
						>
							{/* Tag */}
							<div className="flex h-full w-12 items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600 font-bold text-[10px] text-white">
								INDÉ
							</div>
							{/* Content */}
							<div className="ml-3 flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800">
									{artist.photoUrl ? (
										/* biome-ignore lint/performance/noImgElement: menu avatars use uploaded remote URLs */
										<img
											src={artist.photoUrl}
											alt={artist.stageName}
											className="h-full w-full rounded-full object-cover"
										/>
									) : (
										<Mic2 className="h-4 w-4 text-zinc-400" />
									)}
								</div>
								<span className="font-bold text-sm tracking-wide">
									{artist.stageName}
								</span>
							</div>
						</Link>
					))}

					{/* Venues */}
					{venueItems.map((venue) => (
						<Link
							key={venue.id}
							href={`/venue/${venue.id}`}
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
										/* biome-ignore lint/performance/noImgElement: menu avatars use uploaded remote URLs */
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

				{canUseSearch ? (
					<DropdownMenuItem
						className="flex cursor-pointer items-center gap-2 p-4 text-zinc-400 hover:text-white focus:bg-white/5 focus:text-white"
						onClick={() => {
							router.push("/dashboard/search");
						}}
					>
						<Search className="h-4 w-4" />
						<span>Recherche</span>
					</DropdownMenuItem>
				) : null}

				<DropdownMenuItem
					className="flex cursor-pointer items-center gap-2 p-4 text-zinc-400 hover:text-white focus:bg-white/5 focus:text-white"
					onClick={() => {
						router.push("/messages");
					}}
				>
					<MessageCircle className="h-4 w-4" />
					<span className="flex-1">Mes messages</span>
					{totalUnread > 0 ? (
						<Badge
							className="ml-2"
							aria-label={`${totalUnread} messages non lus`}
						>
							{totalUnread}
						</Badge>
					) : null}
				</DropdownMenuItem>

				<DropdownMenuItem
					className="flex cursor-pointer items-center gap-2 p-4 text-zinc-400 hover:text-white focus:bg-white/5 focus:text-white"
					onClick={() => {
						router.push("/dashboard/profile");
					}}
				>
					<User className="h-4 w-4" />
					<span>Mon profil</span>
				</DropdownMenuItem>

				{/* Logout Option */}
				<DropdownMenuItem
					className="flex cursor-pointer items-center gap-2 p-4 text-zinc-400 hover:text-white focus:bg-white/5 focus:text-white"
					onClick={async () => {
						try {
							await authClient.signOut();
							router.push("/");
						} catch {
							toast.error("Erreur lors de la déconnexion. Veuillez réessayer.");
						}
					}}
				>
					<LogOut className="h-4 w-4" />
					<span>Se déconnecter</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
