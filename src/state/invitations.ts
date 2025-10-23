type Role = "leader" | "member";

export type InvitationRecord = {
	id: string;
	email: string;
	group: string;
	role: Role;
	status: "pending";
	tokenHash?: string;
	resendCount: number;
	key: string;
};

const byId = new Map<string, InvitationRecord>();
const byKey = new Map<string, string>();

export function makeKey(githubId: string, email: string) {
	return `${githubId}::${email}`;
}

export function putInvitation(rec: InvitationRecord) {
	byId.set(rec.id, rec);
	byKey.set(rec.key, rec.id);
}

export function getInvitation(id: string): InvitationRecord | undefined {
	return byId.get(id);
}

export function getByCompositeKey(key: string): InvitationRecord | undefined {
	const id = byKey.get(key);
	if (!id) return undefined;
	return byId.get(id);
}

export function setTokenHash(id: string, hash: string) {
	const r = byId.get(id);
	if (!r) return;
	r.tokenHash = hash;
	byId.set(id, r);
}

export function incResend(id: string): number {
	const r = byId.get(id);
	if (!r) return 0;
	r.resendCount += 1;
	byId.set(id, r);
	return r.resendCount;
}
