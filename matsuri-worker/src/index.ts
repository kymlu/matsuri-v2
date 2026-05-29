import * as jose from "jose"

const allowedOrigins = [
  "http://localhost:3000",
  "https://kymlu.github.io",
];

function getCorsHeaders(origin: string | null) {
  const allowed = origin && allowedOrigins.includes(origin);
	console.log("Origin received:", origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cf-Access-Jwt-Assertion",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

const MAX_FILE_SIZE = 1_000_000; // 1 MB

interface Env {
	GITHUB_TOKEN: string;
}

const CLOUDFLARE_CONFIG = {
	team: "matsuri-dance-time",
	audience: "aa95fc36f4c76b797500e467fdbbf43273d72bf1888cfb8de6363663cc2f0904"
}

const GIT_CONFIG = {
  owner: "kymlu",
  repo: "matsuri-v2",
  folderPath: "intake",
  branch: "master" 
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get("Origin");
		const corsHeaders = getCorsHeaders(origin);

		if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

		// Verify Cloudflare Access JWT
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

		try {
      const JWKS = jose.createRemoteJWKSet(
        new URL(`https://${CLOUDFLARE_CONFIG.team}.cloudflareaccess.com/cdn-cgi/access/certs`)
      );
      const verified = await jose.jwtVerify(token, JWKS, {
        issuer: `https://${CLOUDFLARE_CONFIG.team}.cloudflareaccess.com`,
        audience: CLOUDFLARE_CONFIG.audience,
      });
			const payload = verified.payload;
			console.log({
				email: payload.email ?? "",
				user: payload.name ?? "",
				subject: payload.sub ?? "",
			});
    } catch {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const url = new URL(request.url);

		if (url.pathname === "/api/push-file" && request.method === "POST") {
			try {
				const { fileName, fileContent, commitMessage } = await request.json() as any;

				if (!fileName || !fileContent) {
					return new Response(
						JSON.stringify({ error: "Missing fileName or fileContent" }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// 1. Sanitize the filename to prevent folder escape attacks (e.g. "../../../etc")
				const safeFileName = fileName.split("/").pop()?.split("\\").pop();

				if (!safeFileName || safeFileName.includes("..")) {
					return new Response(
						JSON.stringify({ error: "Invalid filename" }),
						{ status: 400, headers: corsHeaders }
					);
				}

				if (safeFileName.length > 120) {
					return new Response(
						JSON.stringify({ error: "Filename too long" }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// 2. Build the exact restricted file path location
				const fullFilePath = `${GIT_CONFIG.folderPath}/${safeFileName}`;

				// 3. Convert content string to base64
				const bytes = new TextEncoder().encode(fileContent);

				if (bytes.length > MAX_FILE_SIZE) {
					return new Response(
						JSON.stringify({ error: "File exceeds 1 MB limit" }),
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
						message: commitMessage || `Automated upload: ${safeFileName}`,
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
					JSON.stringify({ error: "Failed to process push request" }),
					{ status: 500, headers: corsHeaders }
				);
			}
		}

		return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
