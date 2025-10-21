import type { Context } from "hono";
import { Hono } from "hono";
import { validateAndDerive } from "../services/validation";
import { badRequest } from "../utils/errors";

function newId(): string {
	const n = crypto.getRandomValues(new Uint8Array(9));
	const b = Array.from(n, (x) => x.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 18);
	return `inv_${b}`;
}

async function handler(c: Context) {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		throw badRequest("body_parse_error");
	}
	try {
		const { payload: _payload, assignment } = validateAndDerive(body);
		const id = newId();
		return c.json(
			{
				id,
				status: "pending" as const,
				group: assignment.group,
				role: assignment.role,
			},
			202 as const,
		);
	} catch (e) {
		if (e instanceof Error && e.message.startsWith("bad_request:")) {
			const code = e.message.split(":")[1] ?? "bad_request";
			throw badRequest(code);
		}
		throw e;
	}
}

export const invitationsCreate = new Hono().post("/invitations", handler);
