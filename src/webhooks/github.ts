import type { Context } from "hono";
import { Hono } from "hono";
import { verifyGitHubSignature } from "../services/ghsig";
import type { Env } from "../types/env";

type OrgEvent = {
	action: string;
	membership?: { user?: { login?: string; id?: number } | null } | null;
	invitation?: { email?: string | null } | null;
	organization: { login: string };
	sender: { login: string };
};

export const githubWebhook = new Hono<{ Bindings: Env }>().post(
	"/webhooks/github",
	async (c: Context<{ Bindings: Env }>) => {
		const sig = c.req.header("x-hub-signature-256") ?? "";
		const evt = c.req.header("x-github-event") ?? "";
		const body = await c.req.arrayBuffer();
		const secret = c.env.GITHUB_WEBHOOK_SECRET ?? "";
		const ok = await verifyGitHubSignature(secret, body, sig);
		if (!ok) return c.text("sig", 401);
		const json = JSON.parse(new TextDecoder().decode(body)) as OrgEvent;
		if (evt === "organization" && json.action === "member_added")
			return c.text("ok", 200);
		if (evt === "organization" && json.action === "member_invited")
			return c.text("ok", 200);
		return c.text("ignored", 200);
	},
);
