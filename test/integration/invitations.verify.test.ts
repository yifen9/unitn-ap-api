import { env } from "cloudflare:test";
import type { Mock } from "vitest";
import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import app from "../../src/index";
import { isQueued } from "../helpers/guard";

describe("GET /v1/invitations/verify", () => {
	it("200 queued and enqueues job", async () => {
		const g = ROSTER.groups[0];

		const r1 = await app.request(
			"/v1/invitations",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ githubId: "octocat", email: g.leader }),
			},
			env,
		);
		const j1 = (await r1.json()) as { id: string };

		const r2 = await app.request(
			`/v1/invitations/${j1.id}/resend`,
			{ method: "POST" },
			env,
		);
		expect([200, 202]).toContain(r2.status);

		const j2 = (await r2.json()) as { verificationUrl?: string };
		const u = new URL(j2.verificationUrl ?? "http://example.com/?token=x");
		const token = u.searchParams.get("token") ?? "x";

		const r3 = await app.request(
			`/v1/invitations/verify?token=${encodeURIComponent(token)}`,
			{},
			env,
		);
		expect(r3.status).toBe(200);
		const j3: unknown = await r3.json();
		expect(isQueued(j3)).toBe(true);

		const send = (env as unknown as { INVITE_JOBS: { send: unknown } })
			.INVITE_JOBS.send as unknown as Mock;
		expect(send).toHaveBeenCalledTimes(1);
	});
});
