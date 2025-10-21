import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import { validateAndDerive } from "../../src/services/validation";

describe("validateAndDerive with roster", () => {
	const domain = ROSTER.domain;

	it("derives group/role for leader", () => {
		const leader = ROSTER.groups[0].leader;
		const r = validateAndDerive({ githubId: "octocat", email: leader });
		expect(r.assignment.group).toBe(ROSTER.groups[0].group);
		expect(r.assignment.role).toBe("leader");
	});

	it("derives group/role for member", () => {
		const g = ROSTER.groups[1];
		const member = g.members.find((m) => m !== g.leader);
		expect(member).toBeDefined();
		const r = validateAndDerive({
			githubId: "octocat",
			email: member as string,
		});
		expect(r.assignment.group).toBe(g.group);
		expect(r.assignment.role).toBe("member");
	});

	it("rejects non-roster email", () => {
		expect(() =>
			validateAndDerive({ githubId: "octocat", email: `x@${domain}` }),
		).toThrowError(/bad_request:email_not_in_roster/);
	});

	it("rejects wrong domain", () => {
		expect(() =>
			validateAndDerive({ githubId: "octocat", email: "who@example.com" }),
		).toThrowError(/bad_request:email_domain/);
	});
});
