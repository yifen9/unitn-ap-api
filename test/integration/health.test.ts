import { describe, expect, it } from "vitest";
import app from "../../src/index";

type Health = { ok: boolean; ts: number };

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;

const isHealth = (v: unknown): v is Health =>
	isObject(v) && typeof v.ok === "boolean" && typeof v.ts === "number";

describe("GET /v1/healthz", () => {
	it("returns ok with timestamp", async () => {
		const res = await app.request("/v1/healthz");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toMatch(/application\/json/i);
		const json: unknown = await res.json();
		expect(isHealth(json)).toBe(true);
	});
});
