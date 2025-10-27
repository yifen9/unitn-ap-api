export async function verifyGitHubSignature(
	secret: string,
	body: ArrayBuffer,
	signature256: string,
): Promise<boolean> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const mac = await crypto.subtle.sign("HMAC", key, body);
	const hex = Array.from(new Uint8Array(mac))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const expected = `sha256=${hex}`;
	if (signature256.length !== expected.length) return false;
	let ok = 0;
	for (let i = 0; i < expected.length; i++)
		ok |= expected.charCodeAt(i) ^ signature256.charCodeAt(i);
	return ok === 0;
}
