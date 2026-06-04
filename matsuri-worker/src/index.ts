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
	DB: D1Database;
	BUCKET: R2Bucket;
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

const getFileName = (id: string, version: string) => {return `${id}_v${version}.json`};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get("Origin");
		const corsHeaders = getCorsHeaders(origin);

		if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "GET") {
			if (url.pathname === "/api/choreos/summary") {
				try {
					const { results } = await env.DB.prepare(
						`
						SELECT
							c.id AS id,
							c.name AS name,
							c.event_name AS event,
							c.event_start_date AS startDate,
							c.event_end_date AS endDate,
							cf.uploaded_at AS lastUpdated,
							cf.version AS version,
							cf.stage_length AS stageLength,
							cf.stage_width AS stageWidth,
							cf.dancer_count AS dancerCount,
							cf.prop_count AS propCount
						FROM choreos c
						JOIN choreo_files cf
							ON cf.choreo_id = c.id
						WHERE cf.is_current = 1
						ORDER BY cf.uploaded_at DESC;
						`
					).all();
	
					return Response.json(results, {
						status: 200,
						headers: corsHeaders,
					});
				} catch (e: any) {
					return new Response(
						JSON.stringify({ error: "Internal server error" }),
						{ status: 500, headers: corsHeaders }
					);
				}
			} else if (url.pathname === "/api/choreos/file") {
				const choreoId = url.searchParams.get("choreo_id");
				const version = url.searchParams.get("version");
				
				if (choreoId === null) {
					return new Response(
						JSON.stringify({error: "Choreo id must not be null"}),
						{ status: 400, headers: corsHeaders }
					);
				}

				if (version === null) {
					return new Response(
						JSON.stringify({error: "Version must not be null"}),
						{ status: 400, headers: corsHeaders }
					);
				} else {
					if (!Number.isInteger(Number(version))) {
						return new Response(
							JSON.stringify({error: "Version must be an int"}),
							{ status: 400, headers: corsHeaders }
						);
					}
				}

				try {
					const r2Key = getFileName(choreoId, version);
					const object = await env.BUCKET.get(r2Key);
	
					if (!object) {
						return new Response(
							JSON.stringify({error: "Not found"}),
							{ status: 404, headers: corsHeaders }
						);
					}
	
					return new Response(object.body, {
						status: 200,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					});
				} catch (e: any) {
					return new Response(
						JSON.stringify({ error: "Internal server error" }),
						{ status: 500, headers: corsHeaders }
					);
				}
			} else if (url.pathname === "/api/choreos/file/current-version") {
				try {
					const choreoId = url.searchParams.get("choreo_id");
					const row = await env.DB.prepare(
						"SELECT version FROM choreo_files WHERE choreo_id = ? AND is_current = 1"
					).bind(choreoId).first<{ version: number }>();
	
					return Response.json(
						{ version: row?.version ?? 0 },
						{ status: 200, headers: corsHeaders }
					);
				} catch (e: any) {
					return new Response(
						JSON.stringify({ error: "Internal server error" }),
						{ status: 500, headers: corsHeaders }
					);
				}
			}
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

		if (url.pathname === "/api/verify-user" && request.method === "GET") {
			return new Response(JSON.stringify({ email: payload.email ?? "", user: payload.name ?? "" }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		if (request.method === "POST" && url.pathname === "/api/choreos/publish") {
			try {
				const formData = await request.formData();
				const file = formData.get("file") as File;
				const choreoId = formData.get("choreo_id") as string;
				const isNew = formData.get("is_new") === "true";
				const name = formData.get("name") as string;
				const eventName = formData.get("event_name") as string | null;
				const eventStartDate = formData.get("event_start_date") as string | null;
				const eventEndDate = formData.get("event_end_date") as string | null;
				const stageWidth = Number(formData.get("stage_width"));
				const stageLength = Number(formData.get("stage_length"));
				const dancerCount = Number(formData.get("dancer_count"));
				const propCount = Number(formData.get("prop_count"));
				const uploadedBy = (payload.email as String).split("@")[0];

				if (!file || !choreoId || !name) {
					return new Response(
						JSON.stringify({ error: "file, choreo_id, and name are required" }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// get next version number
				let version = 1;
				if (!isNew) {
					const current = await env.DB.prepare(
						"SELECT version FROM choreo_files WHERE choreo_id = ? AND is_current = 1"
					).bind(choreoId).first<{ version: number }>();

					if (!current) {
						return new Response(
							JSON.stringify({ error: "Choreo not found" }),
							{ status: 404, headers: corsHeaders }
						);
					}

					version = current.version + 1;

					// mark old version as not current
					await env.DB.prepare(
						"UPDATE choreo_files SET is_current = 0 WHERE choreo_id = ? AND is_current = 1"
					).bind(choreoId).run();
				}

				// upload to R2
				const r2Key = getFileName(choreoId, version.toString());
				await env.BUCKET.put(r2Key, file.stream(), {
					httpMetadata: { contentType: "application/json" }
				});

				// upsert choreo
				await env.DB.prepare(
					`INSERT INTO choreos (id, name, event_name, event_start_date, event_end_date)
					VALUES (?, ?, ?, ?, ?)
					ON CONFLICT(id) DO UPDATE SET
						name = excluded.name,
						event_name = excluded.event_name,
						event_start_date = excluded.event_start_date,
						event_end_date = excluded.event_end_date`
				).bind(choreoId, name, eventName, eventStartDate, eventEndDate).run();

				// insert new choreo_file row
				const fileId = crypto.randomUUID();
				await env.DB.prepare(
					`INSERT INTO choreo_files (id, choreo_id, version, is_current, stage_width, stage_length, dancer_count, prop_count, uploaded_by)
					VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`
				).bind(fileId, choreoId, version, stageWidth, stageLength, dancerCount, propCount, uploadedBy).run();

				return Response.json(
					{ id: choreoId, version },
					{ status: isNew ? 201 : 200, headers: corsHeaders }
				);
			} catch (e) {
				return new Response(
					JSON.stringify({ error: "Internal server error" }),
					{ status: 500, headers: corsHeaders }
				);
			}
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
