export type Accepted = {
	id: string;
	status: "pending";
	group: string;
	role: "leader" | "member";
};
export type Err = {
	code: string;
	message: string;
	details: Record<string, unknown>;
};
export type Queued = { status: "queued" };
export type Health = { ok: boolean; ts: number };

export function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}
export function isAccepted(v: unknown): v is Accepted {
	return (
		isObject(v) &&
		typeof v.id === "string" &&
		v.status === "pending" &&
		typeof v.group === "string" &&
		(v.role === "leader" || v.role === "member")
	);
}
export function isErr(v: unknown): v is Err {
	return (
		isObject(v) &&
		typeof v.code === "string" &&
		typeof v.message === "string" &&
		isObject(v.details)
	);
}
export function isQueued(v: unknown): v is Queued {
	return isObject(v) && v.status === "queued";
}
export function isHealth(v: unknown): v is Health {
	return isObject(v) && typeof v.ok === "boolean" && typeof v.ts === "number";
}
