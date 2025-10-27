import type { Context, Next } from "hono";
import { HttpError } from "../utils/errors";

export async function errorMiddleware(c: Context, next: Next) {
	try {
		await next();
	} catch (e) {
		if (e instanceof HttpError) {
			return c.json(
				{ code: e.code, message: e.message, details: e.details ?? {} },
				e.status,
			);
		}
		return c.json(
			{ code: "internal_error", message: "internal error", details: {} },
			500 as const,
		);
	}
}
