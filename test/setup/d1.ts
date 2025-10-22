import { env } from "cloudflare:test";
import { beforeAll } from "vitest";

beforeAll(async () => {
	await env.DB.prepare(`CREATE TABLE IF NOT EXISTS invitation_requests (
    id TEXT PRIMARY KEY,
    github_id TEXT NOT NULL,
    email TEXT NOT NULL,
    group_name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();

	await env.DB.prepare(
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_requests_email ON invitation_requests(email)`,
	).run();
});
