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

		const rec = getInvitation(parsed.id);
		if (!rec) return c.text("bad_request", 400);

		const h = await hashToken(token);
		if (!rec.tokenHash || rec.tokenHash !== h)
			return c.text("bad_request", 400);

		await c.env.INVITE_JOBS.send({
			id: rec.id,
			email: rec.email,
			group: rec.group,
			role: rec.role,
		});

		return c.json({ ok: true, id: rec.id, status: "queued" as const }, 200);
	},
);
