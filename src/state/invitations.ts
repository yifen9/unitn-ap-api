import { newRnd } from "../services/token";
import type { Env } from "../types/env";

type Role = "leader" | "member";

export type InvitationRecord = {
	id: string;
	email: string;
	group: string;
	role: Role;
	status: "pending";
	tokenHash?: string | null;
	resendCount: number;
	key: string;
};

export function makeKey(githubId: string, email: string) {
	return `${githubId}::${email}`;
}

export async function putInvitation(
	env: Env,
	rec: InvitationRecord,
): Promise<void> {
	const d1 = env.DB;
	const r = await d1
		.prepare(
			`INSERT INTO invitation_requests (id, github_id, email, group_name, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(github_id, email) DO NOTHING`,
		)
		.bind(
			rec.id,
			rec.key.split("::")[0],
			rec.email,
			rec.group,
			rec.role,
			rec.status,
			Date.now(),
		)
		.run();
	const changes =
		(r as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
	if (changes === 0) return;
}

export async function getInvitation(
	env: Env,
	id: string,
): Promise<InvitationRecord | undefined> {
	const d1 = env.DB;
	const row = await d1
		.prepare(
			`SELECT r.id, r.github_id, r.email, r.group_name, r.role, r.status
       FROM invitation_requests r
       WHERE r.id = ?
       LIMIT 1`,
		)
		.bind(id)
		.first<{
			id: string;
			github_id: string;
			email: string;
			group_name: string;
			role: Role;
			status: "pending";
		}>();
	if (!row) return undefined;

	const tok = await d1
		.prepare(
			`SELECT token_hash
       FROM invitation_tokens
       WHERE invitation_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
		)
		.bind(row.id)
		.first<{ token_hash: string }>();

	return {
		id: row.id,
		email: row.email,
		group: row.group_name,
		role: row.role,
		status: row.status,
		tokenHash: tok?.token_hash ?? null,
		resendCount: 0,
		key: makeKey(row.github_id, row.email),
	};
}

export async function getByCompositeKey(
	env: Env,
	key: string,
): Promise<InvitationRecord | undefined> {
	const d1 = env.DB;
	const [githubId, email] = key.split("::");
	const row = await d1
		.prepare(
			`SELECT r.id, r.github_id, r.email, r.group_name, r.role, r.status
       FROM invitation_requests r
       WHERE r.github_id = ? AND r.email = ?
       LIMIT 1`,
		)
		.bind(githubId, email)
		.first<{
			id: string;
			github_id: string;
			email: string;
			group_name: string;
			role: Role;
			status: "pending";
		}>();
	if (!row) return undefined;

	const tok = await d1
		.prepare(
			`SELECT token_hash
       FROM invitation_tokens
       WHERE invitation_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
		)
		.bind(row.id)
		.first<{ token_hash: string }>();

	return {
		id: row.id,
		email: row.email,
		group: row.group_name,
		role: row.role,
		status: row.status,
		tokenHash: tok?.token_hash ?? null,
		resendCount: 0,
		key,
	};
}

export async function setTokenHash(
	env: Env,
	invitationId: string,
	tokenHash: string,
	expMs: number,
): Promise<void> {
	const d1 = env.DB;
	const tokId = `tok_${newRnd()}`;
	await d1
		.prepare(
			`INSERT INTO invitation_tokens (id, invitation_id, purpose, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(token_hash) DO NOTHING`,
		)
		.bind(tokId, invitationId, "verify", tokenHash, expMs, Date.now())
		.run();
}

export async function incResend(
	env: Env,
	invitationId: string,
): Promise<number> {
	const d1 = env.DB;
	const row = await d1
		.prepare(
			`SELECT COUNT(1) AS n
       FROM invitation_tokens
       WHERE invitation_id = ?`,
		)
		.bind(invitationId)
		.first<{ n: number }>();
	const current = row?.n ?? 0;
	return current + 1;
}
