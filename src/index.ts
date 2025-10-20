import { Hono } from "hono";
import { health } from "./routes/health";
import { invitationsCreate } from "./routes/invitations.create";
import { HttpError } from "./utils/errors";

type Env = Record<string, never>;

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

export default app;
