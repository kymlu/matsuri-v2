declare module "cloudflare:test" {
	interface ProvidedEnv extends Env {
		GITHUB_TOKEN: string
	}
}
