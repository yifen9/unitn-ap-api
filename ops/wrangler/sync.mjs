import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const out = JSON.parse(
	execSync("terraform -chdir=infra/terraform output -json", {
		stdio: ["ignore", "pipe", "inherit"],
	}).toString(),
);

const serviceName = out.service_name.value;
const compat = out.compatibility_date.value;
const dbId = out.d1_database_id.value;
const dbName = out.d1_name.value;

const cfg = {
	name: serviceName,
	main: "src/index.ts",
	compatibility_date: compat,
	d1_databases: [
		{
			binding: "DB",
			database_name: dbName,
			database_id: dbId,
			migrations_dir: "ops/drizzle",
		},
	],
};

writeFileSync("wrangler.generated.json", JSON.stringify(cfg, null, 2));
console.log("wrangler.generated.json updated");
