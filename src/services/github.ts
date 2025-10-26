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

async function createTeam(
	env: Env,
	org: string,
	slug: string,
): Promise<number> {
	const body = JSON.stringify({
		name: slug,
		privacy: "closed",
	});
	let delay = 500;
	for (let i = 0; i < 5; i++) {
		const r = await gh(env, `/orgs/${org}/teams`, {
			method: "POST",
			body,
			headers: { "content-type": "application/json" },
		});
		if (r.status === 201) {
			const j = (await r.json()) as { id: number; slug: string };
			await env.KV?.put(`team:id:${org}:${j.slug}`, String(j.id), {
				expirationTtl: 86400,
			});
			return j.id;
		}
		if (r.status === 422) {
			const g = await gh(env, `/orgs/${org}/teams/${slug}`, { method: "GET" });
			if (g.ok) {
				const j = (await g.json()) as { id: number };
				await env.KV?.put(`team:id:${org}:${slug}`, String(j.id), {
					expirationTtl: 86400,
				});
				return j.id;
			}
		}
		if (r.status === 429 || r.status === 403 || r.status === 503) {
			await new Promise((res) => setTimeout(res, delay));
			delay = Math.min(delay * 2, 8000);
			continue;
		}
		throw new Error(`gh_create_team:${r.status}`);
	}
	throw new Error("gh_create_team_retry_exhausted");
}

export async function ensureTeamIdBySlug(
	env: Env,
	org: string,
	slug: string,
): Promise<number> {
	const k = `team:id:${org}:${slug}`;
	const v = await env.KV?.get(k);
	if (v) return Number(v);

	const r = await gh(env, `/orgs/${org}/teams/${slug}`, { method: "GET" });
	if (r.ok) {
		const j = (await r.json()) as { id: number };
		await env.KV?.put(k, String(j.id), { expirationTtl: 86400 });
		return j.id;
	}

	if (r.status === 404) {
		const id = await createTeam(env, org, slug);
		await env.KV?.put(k, String(id), { expirationTtl: 86400 });
		return id;
	}

	if (r.status === 429 || r.status === 403 || r.status === 503) {
		let delay = 500;
		for (let i = 0; i < 4; i++) {
			await new Promise((res) => setTimeout(res, delay));
			const rr = await gh(env, `/orgs/${org}/teams/${slug}`, { method: "GET" });
			if (rr.ok) {
				const j = (await rr.json()) as { id: number };
				await env.KV?.put(k, String(j.id), { expirationTtl: 86400 });
				return j.id;
			}
			if (rr.status === 404) {
				const id = await createTeam(env, org, slug);
				await env.KV?.put(k, String(id), { expirationTtl: 86400 });
				return id;
			}
			delay = Math.min(delay * 2, 8000);
		}
	}

	throw new Error(`gh_get_team:${r.status}`);
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

export type InviteOptions = {
	maxAttempts?: number;
	baseDelayMs?: number;
};

export async function inviteWithTeams(
	env: Env,
	org: string,
	spec: InviteSpec,
	opts?: InviteOptions,
): Promise<{ id: number }> {
	const ids: number[] = [];
	for (const s of spec.teamSlugs)
		ids.push(await ensureTeamIdBySlug(env, org, s));
	const body = JSON.stringify({
		email: spec.email,
		role: spec.role,
		team_ids: ids,
	});
	const maxAttempts = Math.max(1, opts?.maxAttempts ?? 5);
	let delay = Math.max(100, opts?.baseDelayMs ?? 500);
	for (let i = 0; i < maxAttempts; i++) {
		const r = await gh(env, `/orgs/${org}/invitations`, {
			method: "POST",
			body,
			headers: { "content-type": "application/json" },
		});
		if (r.status === 201) return (await r.json()) as { id: number };
		if (
			r.status === 422 ||
			r.status === 429 ||
			r.status === 403 ||
			r.status === 503
		) {
			await new Promise((res) => setTimeout(res, delay));
			delay = Math.min(delay * 2, 8000);
			continue;
		}
		throw new Error(`gh_invite:${r.status}`);
	}
	throw new Error("gh_invite_retry_exhausted");
}
