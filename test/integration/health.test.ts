import { describe, expect, it } from "vitest";
import app from "../../src/index";
import { isHealth } from "../helpers/guard";

describe("GET /v1/healthz", () => {
	it("200 ok", async () => {
		const r = await app.request("/v1/healthz");
		expect(r.status).toBe(200);
		expect(r.headers.get("content-type")).toMatch(/application\/json/i);
		const j: unknown = await r.json();
		expect(isHealth(j)).toBe(true);
	});
});
