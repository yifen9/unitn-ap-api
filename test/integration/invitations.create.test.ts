import { describe, expect, it } from "vitest";
import app from "../../src/index";

type Accepted = { id: string; status: "pending" };
type Err = { code: string; message: string; details: Record<string, unknown> };

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;

const isAccepted = (v: unknown): v is Accepted =>
	isObject(v) && typeof v.id === "string" && v.status === "pending";

const isErr = (v: unknown): v is Err =>
	isObject(v) &&
	typeof v.code === "string" &&
	typeof v.message === "string" &&
	isObject(v.details);

describe("POST /v1/invitations", () => {
	it("202 for valid payload", async () => {
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				githubId: "octocat",
				email: "alice.rossi@studenti.unitn.it",
				team: "TEAM_A",
				role: "member",
			}),
		});
		expect(res.status).toBe(202);
		expect(res.headers.get("content-type")).toMatch(/application\/json/i);
		const json: unknown = await res.json();
		expect(isAccepted(json)).toBe(true);
	});

	it("400 for invalid email domain", async () => {
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				githubId: "octocat",
				email: "alice@example.com",
				team: "TEAM_A",
				role: "member",
			}),
		});
		expect(res.status).toBe(400);
		const json: unknown = await res.json();
		if (!isErr(json)) throw new Error("bad error shape");
		expect(json.code).toBe("email");
	});

	it("400 for non-JSON body", async () => {
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

	it("400 for non-object JSON", async () => {
		const res = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify("hello"),
		});
		expect(res.status).toBe(400);
		const json: unknown = await res.json();
		if (!isErr(json)) throw new Error("bad error shape");
		expect(json.code).toMatch(/body_not_object|github_id/);
	});
});
