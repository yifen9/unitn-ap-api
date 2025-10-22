import { eq } from "drizzle-orm";
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

		const d1 = (c.env as { DB?: D1Database } | undefined)?.DB;
		if (d1) {
			const db = getDB(c.env);

			const pre = await db
				.select()
				.from(invitationRequests)
				.where(eq(invitationRequests.email, row.email))
				.limit(1);
			if (pre.length > 0) {
				const r0 = pre[0];
				return c.json(
					{ id: r0.id, status: r0.status, group: r0.group, role: r0.role },
					202 as const,
				);
			}

			try {
				await db
					.insert(invitationRequests)
					.values(row)
					.onConflictDoNothing({ target: invitationRequests.email });
			} catch {}

			const post = await db
				.select()
				.from(invitationRequests)
				.where(eq(invitationRequests.email, row.email))
				.limit(1);
			const r1 = post.length > 0 ? post[0] : row;
			return c.json(
				{ id: r1.id, status: r1.status, group: r1.group, role: r1.role },
				202 as const,
			);
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
