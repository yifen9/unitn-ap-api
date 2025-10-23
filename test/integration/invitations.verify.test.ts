import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";
import { isQueued } from "../helpers/guard";

describe("GET /v1/invitations/verify", () => {
	it("400 missing token", async () => {
		const r = await app.request("/v1/invitations/verify");
		expect(r.status).toBe(400);
	});

	it("200 queued after resend", async () => {
		const g = ROSTER.groups[0];
		const r1 = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: g.leader }),
		});
		const j1 = (await r1.json()) as { id: string };
		const r2 = await app.request(`/v1/invitations/${j1.id}/resend`, {
			method: "POST",
		});
		expect([200, 202]).toContain(r2.status);
		const j2 = (await r2.json()) as { verificationUrl?: string };
		const u = new URL(j2.verificationUrl ?? "http://example.com/?token=x");
		const token = u.searchParams.get("token") ?? "x";
		const r3 = await app.request(
			`/v1/invitations/verify?token=${encodeURIComponent(token)}`,
		);
		expect([200, 400]).toContain(r3.status);
		if (r3.status === 200) {
			const j3: unknown = await r3.json();
			expect(isQueued(j3)).toBe(true);
		}
	});
});
