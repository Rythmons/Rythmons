import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
	const session = await getServerSession();

	if (!session.data) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<h1 className="mb-8 font-bold text-3xl">Mon Profil</h1>
			<div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
				<ProfileForm user={session.data.user} />
			</div>
		</div>
	);
}
