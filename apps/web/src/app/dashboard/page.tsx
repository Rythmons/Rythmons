import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import Dashboard from "./dashboard";

export default async function DashboardPage() {
	const session = await getServerSession();

	console.log("[DashboardPage] session:", session);
	console.log("[DashboardPage] session.data:", session.data);

	if (!session.data) {
		console.log("[DashboardPage] No session data, redirecting to /login");
		redirect("/login");
	}

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session.data.user.name}</p>
			<Dashboard session={session.data} />
		</div>
	);
}
