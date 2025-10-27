import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import type * as schema from "./schema";

export type DB = DrizzleD1Database<typeof schema>;
export type EnvWithDB = { DB: D1Database };
export function getDB(env: { DB?: D1Database }) {
	if (!env.DB) throw new Error("no_d1_binding");
	return drizzle(env.DB);
}
