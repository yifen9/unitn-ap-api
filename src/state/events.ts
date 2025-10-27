import type { Env } from "../types/env";

export async function logEvent(
	env: Env,
	invitationId: string | null,
	event: string,
	payload: unknown,
): Promise<void> {
	const d1 = env.DB;
	const id = `evt_${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`;
	await d1
		.prepare(
			`INSERT INTO invitation_events (id, invitation_id, event, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(id, invitationId, event, JSON.stringify(payload ?? {}), Date.now())
		.run();
}
