import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		setupFiles: ["test/setup/d1.ts", "test/types/env.d.ts"],
		pool: "@cloudflare/vitest-pool-workers",
		poolOptions: {
			workers: {
				miniflare: {
					compatibilityDate: "2025-10-20",
					d1Databases: { DB: ":memory:" },
				},
			},
		},
		include: ["test/**/*.{test,spec}.ts"],
	},
});
