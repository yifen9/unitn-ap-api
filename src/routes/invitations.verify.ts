import type { Context } from "hono";
import { Hono } from "hono";
import { hashToken, verifyToken } from "../services/token";
import { getInvitation } from "../state/invitations";
import type { Env } from "../types/env";

export const invitationsVerify = new Hono<{ Bindings: Env }>().get(
	"/invitations/verify",
	async (c: Context<{ Bindings: Env }>) => {
		const token = c.req.query("token");
		if (!token) return c.text("bad_request", 400);

		const secret = c.env?.EMAIL_TOKEN_SECRET ?? "testsecret";
		const parsed = await verifyToken(secret, token);
		if (!parsed) return c.text("bad_request", 400);

		const rec = await getInvitation(c.env, parsed.id);
		if (!rec) return c.text("bad_request", 400);

		const h = await hashToken(token);
		if (!rec.tokenHash || rec.tokenHash !== h)
			return c.text("bad_request", 400);

		const d1 = c.env.DB;
		const now = Date.now();

		await d1
			.prepare(
				`UPDATE invitation_tokens
         SET used_at = ?
         WHERE invitation_id = ? AND token_hash = ?`,
			)
			.bind(now, rec.id, h)
			.run();

		await d1
			.prepare(
				`UPDATE invitation_requests
         SET verified_at = ?
         WHERE id = ?`,
			)
			.bind(now, rec.id)
			.run();

		try {
			await c.env.INVITE_JOBS.send({
				id: rec.id,
				email: rec.email,
				group: rec.group,
				role: rec.role,
			});
		} catch (e) {
			console.error("INVITE_JOBS.send failed", String(e));
		}

		return c.json(
			{
				ok: true,
				id: rec.id,
				status: "queued" as const,
			},
			200,
		);
	},
);
