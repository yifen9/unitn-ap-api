const algo = { name: "HMAC", hash: "SHA-256" };
function b64url(a: ArrayBuffer) {
	const s = btoa(String.fromCharCode(...new Uint8Array(a)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
	return s;
}
async function importKey(secret: string) {
	const raw = new TextEncoder().encode(secret);
	return crypto.subtle.importKey("raw", raw, algo, false, ["sign", "verify"]);
}
export async function signToken(
	secret: string,
	payload: { id: string; exp: number; rnd: string },
) {
	const key = await importKey(secret);
	const data = new TextEncoder().encode(
		`${payload.id}.${payload.exp}.${payload.rnd}`,
	);
	const sig = await crypto.subtle.sign(algo, key, data);
	return `${payload.id}.${payload.exp}.${payload.rnd}.${b64url(sig)}`;
}
export async function verifyToken(secret: string, token: string) {
	const [id, expStr, rnd, sigB64] = token.split(".");
	if (!id || !expStr || !rnd || !sigB64) return null;
	const exp = Number(expStr);
	if (!Number.isFinite(exp) || Date.now() > exp) return null;
	const key = await importKey(secret);
	const data = new TextEncoder().encode(`${id}.${exp}.${rnd}`);
	const sig = Uint8Array.from(
		atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
		(c) => c.charCodeAt(0),
	);
	const ok = await crypto.subtle.verify(algo, key, sig, data);
	if (!ok) return null;
	return { id, exp, rnd };
}
export async function hashToken(token: string) {
	const d = new TextEncoder().encode(token);
	const h = await crypto.subtle.digest("SHA-256", d);
	return b64url(h);
}
export function newRnd() {
	const n = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(n, (x) => x.toString(16).padStart(2, "0")).join("");
}
