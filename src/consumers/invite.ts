import teams from "../../config/teams.json";

import { inviteWithTeams } from "../services/github";
import type { Env } from "../types/env";

function teamSlugs(group: string, role: "leader" | "member"): string[] {
	return [`${teams.groupPrefix}${group}`, teams.roleTeams[role]];
}

export default {
	async queue(batch: MessageBatch, env: Env, _ctx: ExecutionContext) {
		for (const msg of batch.messages) {
			const b = msg.body as {
				id: string;
				email: string;
				group: string;
				role: "leader" | "member";
			};
			const ts = teamSlugs(b.group, b.role);
			const org = env.GITHUB_ORG ?? teams.org;
			let delay = 1;
			for (let i = 0; i < 4; i++) {
				try {
					await inviteWithTeams(env, org, {
						email: b.email,
						role: "direct_member",
						teamSlugs: ts,
					});
					break;
				} catch (e) {
					if (i === 3) throw e;
					await msg.retry({ delaySeconds: delay });
					delay = Math.min(delay * 2, 30);
				}
			}
		}
	},
};
