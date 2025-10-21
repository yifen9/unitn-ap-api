import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";

type Accepted = {
	id: string;
	status: "pending";
	group: string;
	role: "leader" | "member";
};

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;

const isAccepted = (v: unknown): v is Accepted =>
	isObject(v) &&
	typeof v.id === "string" &&
	v.status === "pending" &&
	typeof v.group === "string" &&
	(v.role === "leader" || v.role === "member");

describe("POST /v1/invitations (derive group/role)", () => {
	it("202 and returns derived assignment", async () => {
		const g = ROSTER.groups[0];
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: g.leader }),
		});
		expect(res.status).toBe(202);
		const json: unknown = await res.json();
		if (!isAccepted(json)) throw new Error("bad shape");
		expect(json.group).toBe(g.group);
		expect(json.role).toBe("leader");
	});

	it("400 for email not in roster", async () => {
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				githubId: "octocat",
				email: `nobody@${ROSTER.domain}`,
			}),
		});
		expect(res.status).toBe(400);
		const body = (await res.json()) as Record<string, unknown>;
		expect(body.code).toBe("email_not_in_roster");
	});
});
