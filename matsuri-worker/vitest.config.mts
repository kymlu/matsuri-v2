import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				// The worker creates its email client on every request, so it needs a key even in tests.
				miniflare: { bindings: { RESEND_API_KEY: "re_test" } },
			},
		},
	},
});
