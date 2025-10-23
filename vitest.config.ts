import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
export default defineWorkersConfig({
	test: {
		setupFiles: [
			"test/setup/d1.ts",
			"test/setup/env.ts",
			"test/setup/typings.d.ts",
		],
		pool: "@cloudflare/vitest-pool-workers",
		poolOptions: {
			workers: {
				miniflare: {
					compatibilityDate: "2025-10-22",
					d1Databases: { DB: ":memory:" },
				},
			},
		},
		include: ["test/**/*.{test,spec}.ts"],
	},
});
