import { EMAIL_INDEX, ROSTER } from "../config/roster";

export type InvitationCreateInput = {
	githubId: string;
	email: string;
};

export type DerivedAssignment = {
	group: string;
	role: "leader" | "member";
};

const emailPattern = /^[A-Za-z0-9._%+-]+@studenti\.unitn\.it$/;

export function validateAndDerive(input: unknown): {
	payload: InvitationCreateInput;
	assignment: DerivedAssignment;
} {
	if (typeof input !== "object" || input === null)
		throw new Error("bad_request:body_not_object");
	const v = input as Record<string, unknown>;
	const githubId = v.githubId;
	const email = v.email;
	if (typeof githubId !== "string" || githubId.length === 0)
		throw new Error("bad_request:github_id");
	if (typeof email !== "string") throw new Error("bad_request:email");

	const domain = ROSTER.domain.trim().toLowerCase();
	const lower = email.toLowerCase();
	const suffix = `@${domain}`;

	if (!lower.endsWith(suffix) || !emailPattern.test(lower))
		throw new Error("bad_request:email_domain");

	const found = EMAIL_INDEX.get(lower);
	if (!found) throw new Error("bad_request:email_not_in_roster");

	return {
		payload: { githubId, email: lower },
		assignment: { group: found.group, role: found.role },
	};
}
