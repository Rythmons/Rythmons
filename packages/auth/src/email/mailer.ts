import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
	if (!resend) {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			throw new Error("RESEND_API_KEY is not set");
		}
		resend = new Resend(apiKey);
	}
	return resend;
}

export async function sendMail({
	to,
	subject,
	html,
}: {
	to: string;
	subject: string;
	html: string;
}) {
	const from = process.env.MAIL_FROM;
	if (!from) {
		throw new Error("MAIL_FROM is not set");
	}

	const client = getResend();

	const result = await client.emails.send({
		from,
		to,
		subject,
		html,
	});

	if ("error" in result && result.error) {
		throw result.error;
	}

	return result;
}
