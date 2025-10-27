import type { Context } from "hono";
import { Hono } from "hono";
import { verifyGitHubSignature } from "../services/ghsig";
import { logEvent } from "../state/events";
import type { Env } from "../types/env";

type OrgEvent = {
	action: string;
	membership?: { user?: { login?: string; id?: number } | null } | null;
	invitation?: { email?: string | null } | null;
	organization: { login: string };
	sender: { login: string };
};

async function findInvitationIdByEmail(
	env: Env,
	email: string,
): Promise<string | null> {
	const d1 = env.DB;
	const row = await d1
		.prepare(
			`SELECT id FROM invitation_requests
       WHERE email = ?
       ORDER BY created_at DESC
       LIMIT 1`,
		)
		.bind(email)
		.first<{ id: string }>();
	return row?.id ?? null;
}

export const githubWebhook = new Hono<{ Bindings: Env }>().post(
	"/webhooks/github",
	async (c: Context<{ Bindings: Env }>) => {
		const sig = c.req.header("x-hub-signature-256") ?? "";
		const evt = c.req.header("x-github-event") ?? "";
		const body = await c.req.arrayBuffer();
		const secret = c.env?.GITHUB_WEBHOOK_SECRET ?? "testsecret";
		const ok = await verifyGitHubSignature(secret, body, sig);
		if (!ok) return c.text("sig", 401);
		let json: OrgEvent;
		try {
			json = JSON.parse(new TextDecoder().decode(body)) as OrgEvent;
		} catch {
			return c.text("bad_body", 400);
		}

		if (evt === "organization" && json.action === "member_invited") {
			const email = json.invitation?.email ?? null;
			const invId = email ? await findInvitationIdByEmail(c.env, email) : null;
			if (invId) {
				await c.env.DB.prepare(
					`UPDATE invitation_requests SET invited_at = ? WHERE id = ?`,
				)
					.bind(Date.now(), invId)
					.run();
			}
			await logEvent(c.env, invId, "member_invited", json);
			return c.text("ok", 200);
		}

		if (evt === "organization" && json.action === "member_added") {
			await logEvent(c.env, null, "member_added", json);
			return c.text("ok", 200);
		}

		return c.text("ignored", 200);
	},
);
