import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { app } from "../../src/index";
import { hmac256 } from "../helpers/hmac";

async function countEvents(): Promise<number> {
	const d1 = (env as unknown as { DB: D1Database }).DB;
	const row = await d1
		.prepare(`SELECT COUNT(1) AS n FROM invitation_events`)
		.first<{ n: number }>();
	return row?.n ?? 0;
}

describe("POST /v1/webhooks/github", () => {
	it("401 bad signature", async () => {
		const body = JSON.stringify({
			action: "member_added",
			organization: { login: "x" },
		});
		const r = await app.request("/v1/webhooks/github", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-hub-signature-256": "sha256=00",
			},
			body,
		});
		expect(r.status).toBe(401);
	});

	it("200 good signature and records event", async () => {
		const before = await countEvents();
		const secret = "testsecret";
		const body = JSON.stringify({
			action: "member_invited",
			invitation: { email: "nobody@studenti.unitn.it" },
			organization: { login: "x" },
		});
		const sig = await hmac256(secret, body);
		const r = await app.request(
			"/v1/webhooks/github",
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-hub-signature-256": sig,
					"x-github-event": "organization",
					"x-github-delivery": "d1",
				},
				body,
			},
			env,
		);
		expect([200, 204]).toContain(r.status);
		const after = await countEvents();
		expect(after).toBe(before + 1);
	});
});
