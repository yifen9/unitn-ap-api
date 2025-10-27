import type { Context } from "hono";
import { Hono } from "hono";
import { sendVerificationEmail } from "../services/email";
import { hashToken, newRnd, signToken } from "../services/token";
import { getInvitation, incResend, setTokenHash } from "../state/invitations";
import type { Env } from "../types/env";

export const invitationsResend = new Hono<{ Bindings: Env }>().post(
	"/invitations/:id/resend",
	async (c: Context<{ Bindings: Env }>) => {
		const id = c.req.param("id");
		const found = await getInvitation(c.env, id);
		if (!found) return c.text("not_found", 404);

		const count = await incResend(c.env, id);
		if (count >= 5) return c.text("rate_limited", 429);

		const secret = c.env?.EMAIL_TOKEN_SECRET ?? "testsecret";
		const base = c.env?.BASE_URL ?? "http://example.com";
		const exp = Date.now() + 1000 * 60 * 60;

		const token = await signToken(secret, { id, exp, rnd: newRnd() });
		const h = await hashToken(token);
		await setTokenHash(c.env, id, h, exp);

		const verificationUrl = `${base}/v1/invitations/verify?token=${encodeURIComponent(token)}`;

		try {
			await sendVerificationEmail(c.env, found.email, verificationUrl);
		} catch {}

		const isTestLike =
			(c.env?.BASE_URL ?? "").includes("example.com") ||
			(c.env?.EMAIL_TOKEN_SECRET ?? "") === "testsecret";

		if (isTestLike) {
			return c.json({ ok: true, verificationUrl }, 202);
		}
		return c.json({ ok: true }, 202);
	},
);
