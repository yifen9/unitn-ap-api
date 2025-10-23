import { describe, expect, it } from "vitest";
import { ROSTER } from "../../src/config/roster";
import { validateAndDerive } from "../../src/services/validation";

describe("validateAndDerive roster roles", () => {
	it("leader", () => {
		const g = ROSTER.groups[0];
		const r = validateAndDerive({ githubId: "octocat", email: g.leader });
		expect(r.assignment.group).toBe(g.group);
		expect(r.assignment.role).toBe("leader");
	});
	it("member", () => {
		const g = ROSTER.groups[1];
		const m = g.members.find((e) => e !== g.leader) as string;
		const r = validateAndDerive({ githubId: "octocat", email: m });
		expect(r.assignment.group).toBe(g.group);
		expect(r.assignment.role).toBe("member");
	});
});
