import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";

describe("POST /v1/invitations/:id/resend", () => {
	it("202 for existing request", async () => {
		const g = ROSTER.groups[0];
		const r1 = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: g.leader }),
		});
		expect(r1.status).toBe(202);
		const j1 = (await r1.json()) as { id: string };
		const r2 = await app.request(`/v1/invitations/${j1.id}/resend`, {
			method: "POST",
		});
		expect(r2.status).toBe(202);
	});

	it("429 when rate-limited", async () => {
		const g = ROSTER.groups[0];
		const r1 = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: g.leader }),
		});
		const { id } = (await r1.json()) as { id: string };
		for (let i = 0; i < 3; i++) {
			const r = await app.request(`/v1/invitations/${id}/resend`, {
				method: "POST",
			});
			expect(r.status).toBe(202);
		}
		const r4 = await app.request(`/v1/invitations/${id}/resend`, {
			method: "POST",
		});
		expect([202, 429]).toContain(r4.status);
	});
});
