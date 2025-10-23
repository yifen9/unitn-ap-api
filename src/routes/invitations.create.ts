import { Hono } from "hono";
import { newRnd } from "../services/token";
import {
	type DerivedAssignment,
	type InvitationCreateInput,
	validateAndDerive,
} from "../services/validation";
import {
	getByCompositeKey,
	makeKey,
	putInvitation,
} from "../state/invitations";
import { badRequest } from "../utils/errors";

export const invitationsCreate = new Hono().post("/invitations", async (c) => {
	const ct = c.req.header("content-type") || "";
	if (!/application\/json/i.test(ct)) throw badRequest("body_parse_error");
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		throw badRequest("body_parse_error");
	}
	let payload: InvitationCreateInput;
	let assignment: DerivedAssignment;
	try {
		const r = validateAndDerive(body);
		payload = r.payload;
		assignment = r.assignment;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.startsWith("bad_request:")) {
			const code = msg.split(":")[1] || "bad_request";
			throw badRequest(code);
		}
		throw e;
	}

	const composite = makeKey(payload.githubId, payload.email);
	const existing = getByCompositeKey(composite);
	if (existing) {
		return c.json(
			{
				id: existing.id,
				status: "pending",
				group: existing.group,
				role: existing.role,
			},
			202,
		);
	}

	const id = `inv_${newRnd()}`;
	putInvitation({
		id,
		email: payload.email,
		group: assignment.group,
		role: assignment.role,
		status: "pending",
		resendCount: 0,
		key: composite,
	});

	return c.json(
		{ id, status: "pending", group: assignment.group, role: assignment.role },
		202,
	);
});
