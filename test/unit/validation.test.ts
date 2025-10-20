import { describe, expect, it } from "vitest";
import { validateInvitationCreate } from "../../src/services/validation";

describe("validateInvitationCreate", () => {
	it("accepts a valid payload", () => {
		const v = validateInvitationCreate({
			githubId: "octocat",
			email: "alice.rossi@studenti.unitn.it",
			team: "TEAM_A",
			role: "captain",
		});
		expect(v).toEqual({
			githubId: "octocat",
			email: "alice.rossi@studenti.unitn.it",
			team: "TEAM_A",
			role: "captain",
		});
	});

	it("rejects invalid email domain", () => {
		expect(() =>
			validateInvitationCreate({
				githubId: "octocat",
				email: "alice@example.com",
				team: "TEAM_A",
				role: "member",
			}),
		).toThrowError(/bad_request:email/);
	});

	it("rejects missing githubId", () => {
		expect(() =>
			validateInvitationCreate({
				email: "a@studenti.unitn.it",
				team: "TEAM_A",
				role: "member",
			} as unknown),
		).toThrowError(/bad_request:github_id/);
	});

	it("rejects invalid team", () => {
		expect(() =>
			validateInvitationCreate({
				githubId: "octocat",
				email: "a@studenti.unitn.it",
				team: "TEAM_X",
				role: "member",
			} as unknown),
		).toThrowError(/bad_request:team/);
	});

	it("rejects invalid role", () => {
		expect(() =>
			validateInvitationCreate({
				githubId: "octocat",
				email: "a@studenti.unitn.it",
				team: "TEAM_A",
				role: "owner",
			} as unknown),
		).toThrowError(/bad_request:role/);
	});
});
