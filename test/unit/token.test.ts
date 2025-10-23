import { describe, expect, it } from "vitest";
import { hashToken, signToken, verifyToken } from "../../src/services/token";

describe("token", () => {
	it("sign/verify ok", async () => {
		const t = await signToken("k", {
			id: "a",
			exp: Date.now() + 60000,
			rnd: "r",
		});
		const v = await verifyToken("k", t);
		expect(v?.id).toBe("a");
	});
	it("reject expired", async () => {
		const t = await signToken("k", { id: "a", exp: Date.now() - 1, rnd: "r" });
		const v = await verifyToken("k", t);
		expect(v).toBeNull();
	});
	it("hash stable", async () => {
		const h1 = await hashToken("x");
		const h2 = await hashToken("x");
		expect(h1).toBe(h2);
	});
});
