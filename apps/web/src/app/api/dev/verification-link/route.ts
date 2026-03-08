import { auth, getDevVerificationPreview } from "@rythmons/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return NextResponse.json({ preview: null }, { status: 404 });
	}

	const requestedEmail = new URL(request.url).searchParams.get("email");
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	const email = session?.user?.email ?? requestedEmail;
	if (!email) {
		return NextResponse.json({ preview: null }, { status: 400 });
	}

	return NextResponse.json({
		preview: getDevVerificationPreview(email),
	});
}
