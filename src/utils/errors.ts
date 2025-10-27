import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
	status: ContentfulStatusCode;
	code: string;
	details?: Record<string, unknown>;
	constructor(
		status: ContentfulStatusCode,
		code: string,
		message: string,
		details?: Record<string, unknown>,
	) {
		super(message);
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export function badRequest(code: string, details?: Record<string, unknown>) {
	return new HttpError(400 as const, code, "bad request", details);
}
