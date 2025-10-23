import type { Context } from "hono";
import { Hono } from "hono";
import { hashToken, newRnd, signToken } from "../services/token";
import { getInvitation, incResend, setTokenHash } from "../state/invitations";
import type { Env } from "../types/env";

export const invitationsResend = new Hono<{ Bindings: Env }>().post(
	"/invitations/:id/resend",
	async (c: Context<{ Bindings: Env }>) => {
		const id = c.req.param("id");
		const found = getInvitation(id);
		if (!found) return c.text("not_found", 404);

		const count = incResend(id);
		if (count >= 5) return c.text("rate_limited", 429);

		const secret = c.env?.EMAIL_TOKEN_SECRET ?? "testsecret";
		const base = c.env?.BASE_URL ?? "http://example.com";
		const token = await signToken(secret, {
			id,
			exp: Date.now() + 1000 * 60 * 60,
			rnd: newRnd(),
		});
		const h = await hashToken(token);
		setTokenHash(id, h);
		const verificationUrl = `${base}/v1/invitations/verify?token=${encodeURIComponent(
			token,
		)}`;

		return c.json({ verificationUrl }, 202);
	},
);
