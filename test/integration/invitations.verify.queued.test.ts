import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";

describe("GET /v1/invitations/verify returns queued", () => {
	it("200 queued", async () => {
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
		expect([202, 200]).toContain(r2.status);
		const j2 = (await r2.json()) as { verificationUrl?: string };
		const url = new URL(j2.verificationUrl ?? "http://example.com/?token=x");
		const token = url.searchParams.get("token") ?? "x";
		const r3 = await app.request(
			`/v1/invitations/verify?token=${encodeURIComponent(token)}`,
		);
		expect(r3.status).toBe(200);
		const j3 = (await r3.json()) as { status: string };
		expect(j3.status).toBe("queued");
	});
});
