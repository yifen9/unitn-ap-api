export type Env = {
	DB: D1Database;
	KV?: KVNamespace;
	RESEND_API_KEY?: string;
	BASE_URL?: string;
	GITHUB_TOKEN?: string;
	GITHUB_ORG?: string;
	GITHUB_WEBHOOK_SECRET?: string;
	INVITE_JOBS: Queue;
};
