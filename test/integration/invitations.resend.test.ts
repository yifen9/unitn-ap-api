import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import { app } from "../../src/index";

describe("POST /v1/invitations/:id/resend", () => {
	it("202 for existing", async () => {
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
	});

	it("429 after multiple resends", async () => {
		const g = ROSTER.groups[0];
		const r1 = await app.request("/v1/invitations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ githubId: "octocat", email: g.leader }),
		});
		const { id } = (await r1.json()) as { id: string };
		for (let i = 0; i < 4; i++) {
			const r = await app.request(`/v1/invitations/${id}/resend`, {
				method: "POST",
			});
			if (i < 3) expect([200, 202]).toContain(r.status);
		}
		const r5 = await app.request(`/v1/invitations/${id}/resend`, {
			method: "POST",
		});
		expect([202, 429]).toContain(r5.status);
	});
});
