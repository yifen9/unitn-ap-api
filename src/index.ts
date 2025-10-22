import { Hono } from "hono";
import { health } from "./routes/health";
import { invitationsCreate } from "./routes/invitations.create";
import { invitationsResend } from "./routes/invitations.resend";
import { invitationsVerify } from "./routes/invitations.verify";
import type { Env } from "./types/env";
import { HttpError } from "./utils/errors";
import { githubWebhook } from "./webhooks/github";

const app = new Hono<{ Bindings: Env }>().basePath("/v1");

app.onError((err, c) => {
	if (err instanceof HttpError) {
		return c.json(
			{ code: err.code, message: err.message, details: err.details ?? {} },
			err.status,
		);
	}
	return c.json(
		{ code: "internal_error", message: "internal error", details: {} },
		500 as const,
	);
});

app.route("/", health);
app.route("/", invitationsCreate);
app.route("/", invitationsResend);
app.route("/", invitationsVerify);
app.route("/", githubWebhook);

export default app;
