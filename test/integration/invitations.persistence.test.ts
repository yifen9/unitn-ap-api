import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../../src";

describe("POST /v1/invitations persists", () => {
	it("writes one row", async () => {
		const res = await app.request(
			"/v1/invitations",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					githubId: "octocat",
					email: "alice.rossi@studenti.unitn.it",
				}),
			},
			env,
		);
		expect(res.status).toBe(202);
		const json = (await res.json()) as {
			id: string;
			group: string;
			role: string;
		};
		expect(json.id).toMatch(/^inv_/);
		expect(typeof json.group).toBe("string");
		expect(["leader", "member"]).toContain(json.role);
	});
});
