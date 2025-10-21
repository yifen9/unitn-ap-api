import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const invitationRequests = sqliteTable("invitation_requests", {
	id: text("id").primaryKey(),
	githubId: text("github_id").notNull(),
	email: text("email").notNull(),
	group: text("group").notNull(),
	role: text("role").notNull(),
	status: text("status").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
