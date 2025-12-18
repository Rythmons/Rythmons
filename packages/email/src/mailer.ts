import * as nodemailer from "nodemailer";
import { Resend } from "resend";

let cachedTransporter: nodemailer.Transporter | null = null;
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

async function getTransporter() {
	if (cachedTransporter) return cachedTransporter;

	const testAccount = await nodemailer.createTestAccount();

	cachedTransporter = nodemailer.createTransport({
		host: testAccount.smtp.host,
		port: testAccount.smtp.port,
		secure: testAccount.smtp.secure,
		auth: {
			user: testAccount.user,
			pass: testAccount.pass,
		},
	});

	console.log("📧 Ethereal inbox:", testAccount.web);

	return cachedTransporter;
}

export async function sendMailTest({
	to,
	subject,
	html,
}: {
	to: string;
	subject: string;
	html: string;
}) {
	const transporter = await getTransporter();

	const info = await transporter.sendMail({
		from: process.env.MAIL_FROM,
		to,
		subject,
		html,
	});

	const preview = nodemailer.getTestMessageUrl(info);
	if (preview) {
		console.log("📨 Email preview:", preview);
	}
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
	const client = getResend();

	await client.emails.send({
		from: process.env.MAIL_FROM!,
		to,
		subject,
		html,
	});
}
