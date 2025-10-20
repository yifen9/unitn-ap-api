export const Teams = ["TEAM_A", "TEAM_B", "TEAM_C"] as const;
export type Team = (typeof Teams)[number];

export const Roles = ["captain", "member"] as const;
export type Role = (typeof Roles)[number];

export type InvitationCreateInput = {
	githubId: string;
	email: string;
	team: Team;
	role: Role;
};

const emailRe = /^[A-Za-z0-9._%+-]+@studenti\.unitn\.it$/;

export function validateInvitationCreate(
	input: unknown,
): InvitationCreateInput {
	if (typeof input !== "object" || input === null)
		throw new Error("bad_request:body_not_object");
	const v = input as Record<string, unknown>;
	const githubId = v.githubId;
	const email = v.email;
	const team = v.team;
	const role = v.role;
	if (typeof githubId !== "string" || githubId.length === 0)
		throw new Error("bad_request:github_id");
	if (typeof email !== "string" || !emailRe.test(email))
		throw new Error("bad_request:email");
	if (typeof team !== "string" || !(Teams as readonly string[]).includes(team))
		throw new Error("bad_request:team");
	if (typeof role !== "string" || !(Roles as readonly string[]).includes(role))
		throw new Error("bad_request:role");
	return { githubId, email, team: team as Team, role: role as Role };
}
