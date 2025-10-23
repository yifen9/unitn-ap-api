import { describe, expect, it, vi } from "vitest";
import { inviteWithTeams } from "../../src/services/github";

type Env = { GITHUB_TOKEN?: string; KV?: KVNamespace };

describe("github rate limit handling", () => {
	it("retries on 429 then succeeds", async () => {
		const env: Env = { GITHUB_TOKEN: "t" };
		vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(
				new Response("{}", { status: 429, headers: { "retry-after": "0" } }),
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ id: 1 }), {
					status: 201,
					headers: { "content-type": "application/json" },
				}),
			);

		const r = await inviteWithTeams(
			env as never,
			"o",
			{ email: "a@b.com", role: "direct_member", teamSlugs: [] },
			{ maxAttempts: 3 },
		);
		expect(r.id).toBe(1);
		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
	});
});
