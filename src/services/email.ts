import type { Env } from "../types/env";

export async function sendVerificationEmail(
	env: Env,
	to: string,
	url: string,
): Promise<void> {
	const key = env.RESEND_API_KEY ?? "";
	const from = env.RESEND_FROM ?? "";
	if (!key || !from) return;
	const body = {
		from,
		to,
		subject: "Verify your email for unitn-ap-2025",
		text: `Open this link to verify: ${url}`,
	};
	await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"content-type": "application/json",
		},
		body: JSON.stringify(body),
	});
}
