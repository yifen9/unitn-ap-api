import { env } from "cloudflare:test";
import { beforeAll } from "vitest";

beforeAll(async () => {
	const d1 = (env as unknown as { DB: D1Database }).DB;
	await d1
		.prepare(`
    CREATE TABLE IF NOT EXISTS invitation_requests (
      id TEXT PRIMARY KEY,
      github_id TEXT NOT NULL,
      email TEXT NOT NULL,
      group_name TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      verified_at INTEGER,
      invited_at INTEGER
    )
  `)
		.run();
	await d1
		.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_invitation_requests_github_email
      ON invitation_requests (github_id, email)
  `)
		.run();
	await d1
		.prepare(`
    CREATE TABLE IF NOT EXISTS invitation_tokens (
      id TEXT PRIMARY KEY,
      invitation_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `)
		.run();
	await d1
		.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_tokens_hash
      ON invitation_tokens (token_hash)
  `)
		.run();
	await d1
		.prepare(`
    CREATE TABLE IF NOT EXISTS invitation_events (
      id TEXT PRIMARY KEY,
      invitation_id TEXT,
      event TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
		.run();
});
