import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import { validateAndDerive } from "../../src/services/validation";

describe("validateAndDerive", () => {
	it("accepts leader email and derives leader", () => {
		const g = ROSTER.groups[0];
		const r = validateAndDerive({ githubId: "octocat", email: g.leader });
		expect(r.assignment.group).toBe(g.group);
		expect(r.assignment.role).toBe("leader");
	});

	it("rejects wrong domain", () => {
		expect(() =>
			validateAndDerive({ githubId: "octocat", email: "x@example.com" }),
		).toThrowError(/bad_request:email_domain/);
	});

	it("rejects email not in roster", () => {
		expect(() =>
			validateAndDerive({
				githubId: "octocat",
				email: `nobody@${ROSTER.domain}`,
			}),
		).toThrowError(/bad_request:email_not_in_roster/);
	});
});
