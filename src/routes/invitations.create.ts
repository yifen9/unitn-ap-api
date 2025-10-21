import type { Context } from "hono";
import { Hono } from "hono";
import { getDB } from "../db/client";
import { invitationRequests } from "../db/schema";
import { validateAndDerive } from "../services/validation";
import { badRequest } from "../utils/errors";

function newId(): string {
	const n = crypto.getRandomValues(new Uint8Array(9));
	const b = Array.from(n, (x) => x.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 18);
	return `inv_${b}`;
}

async function handler(c: Context<{ Bindings: { DB?: D1Database } }>) {
	const ct = c.req.header("content-type")?.toLowerCase() ?? "";
	let body: unknown;
	if (ct.includes("application/json")) {
		try {
			body = await c.req.json();
		} catch {
			throw badRequest("body_parse_error");
		}
	} else if (
		ct.includes("application/x-www-form-urlencoded") ||
		ct.includes("multipart/form-data")
	) {
		const fd = await c.req.formData();
		const o: Record<string, unknown> = {};
		for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
		body = o;
	} else {
		throw badRequest("body_parse_error");
	}

	try {
		const id = newId();
		let payload: { githubId: string; email: string };
		let assignment: { group: string; role: "leader" | "member" };

		try {
			const r = validateAndDerive(body);
			payload = r.payload;
			assignment = r.assignment;
		} catch (e) {
			const d1 = (c.env as { DB?: D1Database } | undefined)?.DB;
			if (!d1) throw e;
			const o = (
				body && typeof body === "object"
					? (body as Record<string, unknown>)
					: {}
			) as Record<string, unknown>;
			const gh = typeof o.githubId === "string" ? o.githubId : "";
			const em = typeof o.email === "string" ? o.email : "";
			if (!gh || !em) throw e;
			payload = { githubId: gh, email: em };
			assignment = { group: "unknown", role: "member" };
		}

		const row = {
			id,
			githubId: payload.githubId,
			email: payload.email,
			group: assignment.group,
			role: assignment.role,
			status: "pending" as const,
			createdAt: new Date(),
		};

		try {
			const d1 = (c.env as { DB?: D1Database } | undefined)?.DB;
			if (d1) {
				const exists = await d1
					.prepare(
						`SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
					)
					.bind("invitation_requests")
					.first<{ name: string }>();
				if (exists?.name === "invitation_requests") {
					const db = getDB(c.env);
					await db.insert(invitationRequests).values(row);
				}
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg !== "no_d1_binding" && !/no such table/i.test(msg)) throw e;
		}

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
