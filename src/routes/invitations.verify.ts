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
				400 as const,
			);

		const parsed = await verifyToken(c.env.RESEND_API_KEY ?? "secret", token);
		if (!parsed)
			return c.json(
				{ code: "invalid_token", message: "invalid", details: {} },
				400 as const,
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
				400 as const,
			);

		const t = toks[0];
		if (t.usedAt)
			return c.json(
				{ code: "used_token", message: "used", details: {} },
				400 as const,
			);
		if (Date.now() > Number(t.expiresAt))
			return c.json(
				{ code: "expired_token", message: "expired", details: {} },
				400 as const,
			);

		await d1.batch([
			d1
				.prepare(`UPDATE invitation_requests SET status=? WHERE id=?`)
				.bind("email-verified", parsed.id),
			d1
				.prepare(`UPDATE invitation_tokens SET used_at=? WHERE id=?`)
				.bind(Date.now(), t.id),
		]);

		const rows = await d1
			.prepare(
				`SELECT email, group_name AS "group", role FROM invitation_requests WHERE id=?`,
			)
			.bind(parsed.id)
			.all<{ email: string; group: string; role: "leader" | "member" }>();
		if (!rows || rows.results?.length !== 1)
			return c.json(
				{ code: "not_found", message: "not found", details: {} },
				404 as const,
			);

		const inv = rows.results[0];

		await c.env.INVITE_JOBS.send({
			id: parsed.id,
			email: inv.email,
			group: inv.group,
			role: inv.role,
		});

		return c.json({ ok: true, id: parsed.id, status: "queued" }, 200 as const);
	},
);
