import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";
import { isAccepted, isErr } from "../helpers/guard";

describe("POST /v1/invitations", () => {
	it("202 derives assignment", async () => {
		const g = ROSTER.groups[0];
		const r = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: g.leader }),
		});
		expect(r.status).toBe(202);
		const j: unknown = await r.json();
		expect(isAccepted(j)).toBe(true);
	});

	it("400 invalid domain", async () => {
		const r = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: "x@example.com" }),
		});
		expect(r.status).toBe(400);
		const j: unknown = await r.json();
		expect(isErr(j)).toBe(true);
	});

	it("400 non-json body", async () => {
		const r = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "text/plain" },
			body: "hello",
		});
		expect(r.status).toBe(400);
		const j: unknown = await r.json();
		expect(isErr(j)).toBe(true);
	});
});
