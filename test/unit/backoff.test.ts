import { describe, expect, it } from "vitest";
import { expBackoffSeconds } from "../../src/services/github";

describe("expBackoffSeconds", () => {
	it("yields 1,2,4,8,16 minutes", () => {
		const g = expBackoffSeconds(60, 2);
		const vals: number[] = [];
		for (let i = 0; i < 5; i++) {
			const v = g.next().value;
			if (typeof v !== "number") throw new Error("bad backoff value");
			vals.push(v);
		}
		expect(vals.map((s) => s / 60)).toEqual([1, 2, 4, 8, 16]);
	});
});
