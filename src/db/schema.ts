import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const invitationRequests = sqliteTable(
	"invitation_requests",
	{
		id: text("id").primaryKey(),
		githubId: text("github_id").notNull(),
		email: text("email").notNull(),
		group: text("group_name").notNull(),
		role: text("role").notNull(),
		status: text("status").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(t) => ({
		uqEmail: uniqueIndex("idx_invitation_requests_email").on(t.email),
	}),
);

export const invitationTokens = sqliteTable(
	"invitation_tokens",
	{
		id: text("id").primaryKey(),
		invitationId: text("invitation_id").notNull(),
		purpose: text("purpose").notNull(),
		tokenHash: text("token_hash").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		usedAt: integer("used_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(t) => ({
		uqToken: uniqueIndex("idx_invitation_tokens_hash").on(t.tokenHash),
	}),
);
