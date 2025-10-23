import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("GET /v1/invitations/verify errors", () => {
	it("400 on missing token", async () => {
		const r = await app.request("/v1/invitations/verify");
		expect(r.status).toBe(400);
	});
	it("400 on invalid token", async () => {
		const r = await app.request("/v1/invitations/verify?token=bad");
		expect(r.status).toBe(400);
	});
});
