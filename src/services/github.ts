import type { Env } from "../types/env";

const H = {
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28",
};

async function gh(env: Env, path: string, init?: RequestInit) {
	const r = await fetch(`https://api.github.com${path}`, {
		...init,
		headers: {
			...H,
			Authorization: `Bearer ${env.GITHUB_TOKEN ?? ""}`,
			...(init?.headers ?? {}),
		},
	});
	return r;
}

export async function getTeamIdBySlug(
	env: Env,
	org: string,
	slug: string,
): Promise<number> {
	const k = `team:id:${org}:${slug}`;
	const v = await env.KV?.get(k);
	if (v) return Number(v);
	const r = await gh(env, `/orgs/${org}/teams/${slug}`, { method: "GET" });
	if (!r.ok) throw new Error(`gh_get_team:${r.status}`);
	const j = (await r.json()) as { id: number };
	await env.KV?.put(k, String(j.id), { expirationTtl: 86400 });
	return j.id;
}

export type InviteSpec = {
	email: string;
	role: "admin" | "direct_member" | "billing_manager" | "reinstate";
	teamSlugs: string[];
};

export async function inviteWithTeams(
	env: Env,
	org: string,
	spec: InviteSpec,
): Promise<{ id: number }> {
	const ids: number[] = [];
	for (const s of spec.teamSlugs) ids.push(await getTeamIdBySlug(env, org, s));
	const body = JSON.stringify({
		email: spec.email,
		role: spec.role,
		team_ids: ids,
	});
	let delay = 500;
	for (let i = 0; i < 4; i++) {
		const r = await gh(env, `/orgs/${org}/invitations`, {
			method: "POST",
			body,
			headers: { "content-type": "application/json" },
		});
		if (r.status === 201) return (await r.json()) as { id: number };
		if (r.status === 422 || r.status === 429) {
			await new Promise((res) => setTimeout(res, delay));
			delay *= 2;
			continue;
		}
		throw new Error(`gh_invite:${r.status}`);
	}
	throw new Error("gh_invite_retry_exhausted");
}
