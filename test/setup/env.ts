import { env } from "cloudflare:test";
import { beforeEach } from "vitest";

type Q = {
	send: (v: unknown) => Promise<void>;
	sendBatch?: (v: unknown[]) => Promise<void>;
};

declare module "cloudflare:test" {
	interface ProvidedEnv {
		DB: D1Database;
		KV?: KVNamespace;
		INVITE_JOBS: Q;
		BASE_URL?: string;
		EMAIL_TOKEN_SECRET?: string;
		GITHUB_TOKEN?: string;
		GITHUB_ORG?: string;
		GITHUB_WEBHOOK_SECRET?: string;
	}
}

beforeEach(async () => {
	const q: Q = { send: async () => {}, sendBatch: async () => {} };
	(env as unknown as { INVITE_JOBS: Q }).INVITE_JOBS = q;
	(env as unknown as { BASE_URL: string }).BASE_URL = "http://example.com";
	(env as unknown as { EMAIL_TOKEN_SECRET: string }).EMAIL_TOKEN_SECRET =
		"testsecret";
	(env as unknown as { GITHUB_WEBHOOK_SECRET: string }).GITHUB_WEBHOOK_SECRET =
		"testsecret";
});
