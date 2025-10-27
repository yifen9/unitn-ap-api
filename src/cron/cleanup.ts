import type { Env } from "../types/env";

export default {
	async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
		const d1 = env.DB;
		await d1
			.prepare(
				`DELETE FROM invitation_tokens WHERE expires_at < ? AND used_at IS NULL`,
			)
			.bind(Date.now())
			.run();
	},
};
