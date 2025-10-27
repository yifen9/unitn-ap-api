import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./ops/drizzle",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: process.env.CF_ACCOUNT_ID as string,
		databaseId: process.env.CF_D1_DATABASE_ID as string,
		token: process.env.CF_API_TOKEN as string,
	},
});
