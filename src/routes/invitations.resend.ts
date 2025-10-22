import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { getDB } from "../db/client";
import { invitationRequests, invitationTokens } from "../db/schema";
import { hashToken, newRnd, signToken } from "../services/token";
import type { Env } from "../types/env";

export const invitationsResend = new Hono<{ Bindings: Env }>().post(
	"/invitations/:id/resend",
	async (c: Context<{ Bindings: Env }>) => {
		const id = c.req.param("id");
		const d1 = c.env.DB;
		const db = getDB({ DB: d1 });
		const rows = await db
			.select()
			.from(invitationRequests)
			.where(eq(invitationRequests.id, id))
			.limit(1);
		if (rows.length === 0)
			return c.json(
				{ code: "not_found", message: "not found", details: {} },
				404,
			);
		const inv = rows[0];

		const kv = c.env.KV;
		if (kv) {
			const k = `rl:resend:${inv.email}`;
			const v = await kv.get(k);
			const n = v ? Number(v) : 0;
			if (n >= 3)
				return c.json(
					{ code: "rate_limited", message: "rate limited", details: {} },
					429,
				);
			await kv.put(k, String(n + 1), { expirationTtl: 3600 });
		}

		const exp = Date.now() + 15 * 60 * 1000;
		const rnd = newRnd();
		const token = await signToken(c.env.RESEND_API_KEY ?? "secret", {
			id: inv.id,
			exp,
			rnd,
		});
		const th = await hashToken(token);
		await db.insert(invitationTokens).values({
			id: `tok_${rnd}`,
			invitationId: inv.id,
			purpose: "email-verify",
			tokenHash: th,
			expiresAt: new Date(exp),
			createdAt: new Date(),
		});
		const url = `${c.env.BASE_URL}/v1/invitations/verify?token=${encodeURIComponent(token)}`;

		const key = c.env.RESEND_API_KEY;
		if (!key)
			return c.json(
				{ code: "no_email_provider", message: "misconfigured", details: {} },
				500,
			);
		const resp = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				Authorization: `Bearer ${key}`,
			},
			body: JSON.stringify({
				from: "unitn-ap <no-reply@unitn.yifen9.li>",
				to: [inv.email],
				subject: "Confirm your email",
				html: `<p>Click to verify: <a href="${url}">${url}</a></p>`,
			}),
		});
		if (!resp.ok)
			return c.json(
				{ code: "mail_failed", message: "mail failed", details: {} },
				502,
			);
		return c.json({ ok: true }, 202);
	},
);
