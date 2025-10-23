import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";
import { isAccepted } from "../helpers/guard";

describe("POST /v1/invitations idempotency", () => {
	it("returns same id for duplicate", async () => {
		const g = ROSTER.groups[0];
		const payload = { githubId: "octocat", email: g.leader };
		const r1 = await app.request(
			"/v1/invitations",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload),
			},
			env,
		);
		expect(r1.status).toBe(202);
		const j1: unknown = await r1.json();
		expect(isAccepted(j1)).toBe(true);
		const id1 = (j1 as { id: string }).id;

		const r2 = await app.request(
			"/v1/invitations",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload),
			},
			env,
		);
		expect(r2.status).toBe(202);
		const j2: unknown = await r2.json();
		expect(isAccepted(j2)).toBe(true);
		const id2 = (j2 as { id: string }).id;

		expect(id2).toBe(id1);
	});
});
