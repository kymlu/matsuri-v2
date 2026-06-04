import * as jose from "jose"

const allowedOrigins = [
  "http://localhost:3000",
  "https://matsuri-v2.pages.dev",
];

function getCorsHeaders(origin: string | null) {
  const allowed = origin && (
		allowedOrigins.includes(origin) ||
    /^https:\/\/([a-z0-9-]+\.)?sitename\.pages\.dev$/.test(origin)
	);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Matsuri-Access-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
		"Access-Control-Allow-Credentials": "true",
  };
}

const MAX_FILE_SIZE = 1_000_000; // 1 MB

interface Env {
	GITHUB_TOKEN: string;
}

const CLOUDFLARE_CONFIG = {
	team: "matsuri-dance-time",
	audience: "f4fb4edffaf2dfc45b755d82ede9655be780d7d5418e9785ef08e5a21b69745c"
}

const GIT_CONFIG = {
  owner: "kymlu",
  repo: "matsuri-v2",
  folderPath: "intake",
  branch: "cloudflare-test" 
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get("Origin");
		const corsHeaders = getCorsHeaders(origin);

		if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

		// Verify Cloudflare Access JWT
    const token = request.headers.get('X-Matsuri-Access-Token');
		console.log("headers:", Object.fromEntries(request.headers.entries()));
    if (!token) {
      return new Response(
				JSON.stringify({error: "No access token provided. Please log in."}),
				{ status: 401, headers: corsHeaders }
			);
    }

		var payload: jose.JWTPayload | null = null;

		try {
      const JWKS = jose.createRemoteJWKSet(
        new URL(`https://${CLOUDFLARE_CONFIG.team}.cloudflareaccess.com/cdn-cgi/access/certs`)
      );
      const verified = await jose.jwtVerify(token, JWKS, {
        issuer: `https://${CLOUDFLARE_CONFIG.team}.cloudflareaccess.com`,
        audience: CLOUDFLARE_CONFIG.audience,
      });
			payload = verified.payload;
			console.log({
				email: payload.email ?? "",
				user: payload.name ?? "",
				subject: payload.sub ?? "",
			});
    } catch (e: any) {
			console.error(e);
      return new Response(
				JSON.stringify({error: "Invalid or expired access token. Please log in again."}),
				{ status: 401, headers: corsHeaders }
			);
    }

    const url = new URL(request.url);

		if (url.pathname === "/api/verify-user" && request.method === "GET") {
			return new Response(JSON.stringify({ email: payload.email ?? "", user: payload.name ?? "" }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		if (url.pathname === "/api/push-file" && request.method === "POST") {
			try {
				const { fileName, fileContent, commitMessage } = await request.json() as any;

				if (!fileName || !fileContent) {
					return new Response(
						JSON.stringify({ error: "Missing fileName or fileContent." }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// 1. Sanitize the filename to prevent folder escape attacks (e.g. "../../../etc")
				const safeFileName = fileName.split("/").pop()?.split("\\").pop();

				if (!safeFileName || safeFileName.includes("..")) {
					return new Response(
						JSON.stringify({ error: "Invalid filename." }),
						{ status: 400, headers: corsHeaders }
					);
				}

				if (safeFileName.length > 120) {
					return new Response(
						JSON.stringify({ error: "Filename too long." }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// 2. Build the exact restricted file path location
				const fullFilePath = `${GIT_CONFIG.folderPath}/${safeFileName}`;

				// 3. Convert content string to base64
				const bytes = new TextEncoder().encode(fileContent);

				if (bytes.length > MAX_FILE_SIZE) {
					return new Response(
						JSON.stringify({ error: "File exceeds 1 MB limit." }),
						{ status: 413, headers: corsHeaders }
					);
				}
				
				let binary = "";
				for (const byte of bytes) {
					binary += String.fromCharCode(byte);
				}

				const base64Content = btoa(binary);

				// 4. Assemble the destination URL
				const githubUrl = `https://api.github.com/repos/${GIT_CONFIG.owner}/${GIT_CONFIG.repo}/contents/${fullFilePath}`;

				// 5. Send request securely to GitHub
				const githubResponse = await fetch(githubUrl, {
					method: "PUT",
					headers: {
						"Authorization": `Bearer ${env.GITHUB_TOKEN}`,
						"Accept": "application/vnd.github+json",
						"User-Agent": "Cloudflare-Worker-App",
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						message: `[Skip-CI] ${commitMessage} by ${(payload.email as String).split("@")[0]}` || `[Skip-CI] Automated upload: ${safeFileName}`,
						content: base64Content,
						branch: GIT_CONFIG.branch
					})
				});

				const githubData = await githubResponse.json() as any;

				if (!githubResponse.ok) {
					console.error(githubData.message);
					return new Response(
						JSON.stringify({ error: githubData.message || "GitHub API Error" }),
						{ status: githubResponse.status, headers: corsHeaders }
					);
				}

				return new Response(JSON.stringify({ 
					message: "Successfully saved to target location!", 
					path: fullFilePath 
				}), { status: 200, headers: corsHeaders });

			} catch (err) {
				return new Response(
					JSON.stringify({ error: "Failed to process push request." }),
					{ status: 500, headers: corsHeaders }
				);
			}
		}

		return new Response(
			JSON.stringify({ error: "Endpoint not found." }),
			{ status: 404, headers: corsHeaders }
		);
  }
};
