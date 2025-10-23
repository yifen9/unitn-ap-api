import type { MessageBatch } from "@cloudflare/workers-types";
import type { Context } from "hono";
import { Hono } from "hono";
import inviteConsumer from "./consumers/invite";
import cleanup from "./cron/cleanup";
import { health } from "./routes/health";
import { invitationsCreate } from "./routes/invitations.create";
import { invitationsResend } from "./routes/invitations.resend";
import { invitationsVerify } from "./routes/invitations.verify";
import type { Env } from "./types/env";
import { HttpError } from "./utils/errors";
import { githubWebhook } from "./webhooks/github";

const app = new Hono();
const v1 = new Hono();

const onError = (err: unknown, c: Context) => {
	if (err instanceof HttpError) {
		return c.json(
			{ code: err.code, message: err.message, details: err.details ?? {} },
			err.status,
		);
	}
	return c.json(
		{ code: "internal_error", message: "internal error", details: {} },
		500,
	);
};

app.onError(onError);
v1.onError(onError);

v1.route("/", health);
v1.route("/", invitationsCreate);
v1.route("/", invitationsResend);
v1.route("/", invitationsVerify);
v1.route("/", githubWebhook);

app.route("/v1", v1);

export { app };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		return app.fetch(request, env, ctx);
	},
	async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext) {
		await inviteConsumer.queue(batch, env, ctx);
	},
	scheduled: cleanup.scheduled,
};
