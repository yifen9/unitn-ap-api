import { describe, expect, it } from "vitest";
import app from "../../src/index";

function hmac(secret: string, body: string) {
	const key = crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return key
		.then((k) => crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body)))
		.then((buf) => {
			const hex = Array.from(new Uint8Array(buf))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			return `sha256=${hex}`;
		});
}

describe("POST /v1/webhooks/github", () => {
	it("401 on bad signature", async () => {
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

	it("200 on good signature", async () => {
		const secret = "testsecret";
		const body = JSON.stringify({
			action: "member_added",
			organization: { login: "x" },
		});
		const sig = await hmac(secret, body);
		const r = await app.request("/v1/webhooks/github", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-hub-signature-256": sig,
				"x-github-event": "organization",
				"x-github-delivery": "d1",
			},
			body,
		});
		expect([200, 204]).toContain(r.status);
	});
});
