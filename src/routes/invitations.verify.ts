import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { getDB } from "../db/client";
import { invitationTokens } from "../db/schema";
import { hashToken, verifyToken } from "../services/token";
import type { Env } from "../types/env";

export const invitationsVerify = new Hono<{ Bindings: Env }>().get(
	"/invitations/verify",
	async (c: Context<{ Bindings: Env }>) => {
		const token = new URL(c.req.url).searchParams.get("token") ?? "";
		if (!token)
			return c.json(
				{ code: "bad_request", message: "no token", details: {} },
				400,
			);
		const parsed = await verifyToken(c.env.RESEND_API_KEY ?? "secret", token);
		if (!parsed)
			return c.json(
				{ code: "invalid_token", message: "invalid", details: {} },
				400,
			);

		const d1 = c.env.DB;
		const db = getDB({ DB: d1 });

		const th = await hashToken(token);
		const toks = await db
			.select()
			.from(invitationTokens)
			.where(eq(invitationTokens.tokenHash, th))
			.limit(1);
		if (toks.length === 0)
			return c.json(
				{ code: "invalid_token", message: "not found", details: {} },
				400,
			);
		const t = toks[0];
		if (t.usedAt)
			return c.json({ code: "used_token", message: "used", details: {} }, 400);
		if (Date.now() > Number(t.expiresAt))
			return c.json(
				{ code: "expired_token", message: "expired", details: {} },
				400,
			);

		await d1.batch([
			d1
				.prepare(`UPDATE invitation_requests SET status=? WHERE id=?`)
				.bind("email-verified", parsed.id),
			d1
				.prepare(`UPDATE invitation_tokens SET used_at=? WHERE id=?`)
				.bind(Date.now(), t.id),
		]);

		return c.json({ ok: true, id: parsed.id, status: "email-verified" }, 200);
	},
);
