import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";

type Accepted = {
	id: string;
	status: "pending";
	group: string;
	role: "leader" | "member";
};
type Err = { code: string; message: string; details: Record<string, unknown> };

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;
const isAccepted = (v: unknown): v is Accepted =>
	isObject(v) &&
	typeof v.id === "string" &&
	v.status === "pending" &&
	typeof v.group === "string" &&
	(v.role === "leader" || v.role === "member");
const isErr = (v: unknown): v is Err =>
	isObject(v) &&
	typeof v.code === "string" &&
	typeof v.message === "string" &&
	isObject(v.details);

describe("POST /v1/invitations", () => {
	it("202 on valid payload; returns derived assignment", async () => {
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
		expect(["leader", "member"]).toContain(json.role);
	});

	it("400 on invalid email domain", async () => {
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: "alice@example.com" }),
		});
		expect(res.status).toBe(400);
		const json: unknown = await res.json();
		if (!isErr(json)) throw new Error("bad error shape");
		expect(json.code).toBe("email_domain");
	});

	it("400 on non-JSON body", async () => {
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "text/plain" },
			body: "not json",
		});
		expect(res.status).toBe(400);
		const json: unknown = await res.json();
		if (!isErr(json)) throw new Error("bad error shape");
		expect(json.code).toBe("body_parse_error");
	});

	it("400 on non-object JSON", async () => {
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify("hello"),
		});
		expect(res.status).toBe(400);
		const json: unknown = await res.json();
		if (!isErr(json)) throw new Error("bad error shape");
		expect(["body_not_object", "github_id"]).toContain(json.code);
	});
});
