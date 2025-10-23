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

export function* expBackoffSeconds(baseSeconds = 60, factor = 2) {
	let n = baseSeconds;
	while (true) {
		yield n;
		n *= factor;
	}
}

export async function inviteWithTeams(
	env: Env,
	org: string,
	spec: InviteSpec,
	opts?: { maxAttempts?: number },
): Promise<{ id: number }> {
	const ids: number[] = [];
	for (const s of spec.teamSlugs) ids.push(await getTeamIdBySlug(env, org, s));
	const body = JSON.stringify({
		email: spec.email,
		role: spec.role,
		team_ids: ids,
	});

	const maxAttempts = opts?.maxAttempts ?? 6;
	const backoff = expBackoffSeconds(60, 2); // 1,2,4,8,16,32... minutes in seconds

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const r = await gh(env, `/orgs/${org}/invitations`, {
			method: "POST",
			body,
			headers: { "content-type": "application/json" },
		});

		if (r.status === 201) return (await r.json()) as { id: number };

		if (r.status === 429 || r.status === 403) {
			const ra = r.headers.get("retry-after");
			if (ra) {
				const secs = Math.max(0, Number(ra));
				await new Promise((res) => setTimeout(res, secs * 1000));
				continue;
			}
			const remaining = Number(r.headers.get("x-ratelimit-remaining") ?? "");
			const reset = Number(r.headers.get("x-ratelimit-reset") ?? "");
			if (
				Number.isFinite(remaining) &&
				remaining === 0 &&
				Number.isFinite(reset)
			) {
				const waitMs = Math.max(0, reset * 1000 - Date.now());
				await new Promise((res) => setTimeout(res, waitMs));
				continue;
			}
			const wait = backoff.next().value as number;
			await new Promise((res) => setTimeout(res, wait * 1000));
			continue;
		}

		if (r.status === 422) {
			const wait = backoff.next().value as number;
			await new Promise((res) => setTimeout(res, wait * 1000));
			continue;
		}

		throw new Error(`gh_invite:${r.status}`);
	}
	throw new Error("gh_invite_retry_exhausted");
}
