import { describe, expect, it } from "vitest";
import { verifyGitHubSignature } from "../../src/services/ghsig";

function hexOf(buf: ArrayBuffer): string {
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

describe("verifyGitHubSignature", () => {
	it("accept valid sha256", async () => {
		const s = "k";
		const b = new TextEncoder().encode("body");
		const key = await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(s),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const mac = await crypto.subtle.sign("HMAC", key, b);
		const sig = `sha256=${hexOf(mac)}`;
		const ok = await verifyGitHubSignature(s, b.buffer, sig);
		expect(ok).toBe(true);
	});
	it("reject bad sig", async () => {
		const ok = await verifyGitHubSignature(
			"k",
			new TextEncoder().encode("body").buffer,
			"sha256=00",
		);
		expect(ok).toBe(false);
	});
});
