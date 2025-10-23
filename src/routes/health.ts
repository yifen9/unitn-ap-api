import { Hono } from "hono";

export const health = new Hono().get("/healthz", (c) => {
	return c.json({ ok: true, ts: Date.now() }, 200);
});
