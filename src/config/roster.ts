import roster from "../../config/roster.json";

export type Roster = {
	domain: string;
	groups: Array<{
		group: string;
		leader: string;
		members: string[];
	}>;
};

export type EmailInfo = { group: string; role: "leader" | "member" };

function buildIndex(r: Roster): Map<string, EmailInfo> {
	const m = new Map<string, EmailInfo>();
	for (const g of r.groups) {
		const leader = g.leader.toLowerCase();
		for (const raw of g.members) {
			const email = raw.toLowerCase();
			const role: "leader" | "member" = email === leader ? "leader" : "member";
			m.set(email, { group: g.group, role });
		}
	}
	return m;
}

export const ROSTER: Roster = roster as Roster;
export const EMAIL_INDEX: Map<string, EmailInfo> = buildIndex(ROSTER);
