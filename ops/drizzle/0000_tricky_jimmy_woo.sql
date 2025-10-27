CREATE TABLE `invitation_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` text NOT NULL,
	`email` text NOT NULL,
	`group_name` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_invitation_requests_github_email` ON `invitation_requests` (`github_id`,`email`);--> statement-breakpoint
CREATE TABLE `invitation_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`invitation_id` text NOT NULL,
	`purpose` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_invitation_tokens_hash` ON `invitation_tokens` (`token_hash`);