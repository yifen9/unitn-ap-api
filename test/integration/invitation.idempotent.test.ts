import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";

type Accepted = {
	id: string;
	status: "pending";
	group: string;
	role: "leader" | "member";
};

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

function isAccepted(v: unknown): v is Accepted {
	return (
		isObject(v) &&
		typeof v.id === "string" &&
		v.status === "pending" &&
		typeof v.group === "string" &&
		(v.role === "leader" || v.role === "member")
	);
}

describe("POST /v1/invitations idempotency", () => {
	it("returns same id for duplicate submissions", async () => {
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
		const a1 = j1 as Accepted;

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
		const a2 = j2 as Accepted;

		expect(a2.id).toBe(a1.id);
	});
});
