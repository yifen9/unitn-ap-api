import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
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
