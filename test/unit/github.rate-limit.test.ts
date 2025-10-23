import { describe, expect, it, vi } from "vitest";
import { inviteWithTeams } from "../../src/services/github";

type Env = { GITHUB_TOKEN?: string; KV?: KVNamespace };

describe("github rate limit handling", () => {
	it("retries on 429 with Retry-After or backoff", async () => {
		const env: Env = { GITHUB_TOKEN: "t" };
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({}), {
					status: 429,
					headers: { "retry-after": "0" },
				}),
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ id: 1 }), {
					status: 201,
					headers: { "content-type": "application/json" },
				}),
			);
		(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;

		const r = await inviteWithTeams(env as never, "o", {
			email: "a@b.com",
			role: "direct_member",
			teamSlugs: [],
		});
		expect(r.id).toBe(1);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
