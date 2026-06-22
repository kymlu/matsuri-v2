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
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
		"Access-Control-Allow-Credentials": "true",
  };
}

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const newHashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return newHashHex === hashHex;
};

interface Env {
	DB: D1Database;
	BUCKET: R2Bucket;
}

const getFileName = (id: string, version: string) => {return `${id}_v${version}.json`};
const setSessionCookie = (token: string) => `token=${token}; HttpOnly; Secure; SameSite=None; Max-Age=2592000; Path=/`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get("Origin");
		const corsHeaders = getCorsHeaders(origin);

		if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
		const teamId = url.searchParams.get("team_id");

    if (request.method === "GET") {
			if (url.pathname === "/api/auth/verify-team") {
				const teamSlug = url.searchParams.get("team_slug");

				if (!teamSlug) {
					return new Response(
						JSON.stringify({ error: "team_slug is required" }),
						{ status: 400, headers: corsHeaders }
					);
				}

				const team = await env.DB.prepare(
					"SELECT id, name, slug FROM teams WHERE slug = ?"
				).bind(teamSlug).first();

				if (!team) {
					return new Response(
						JSON.stringify({ error: "Team not found" }),
						{ status: 404, headers: corsHeaders }
					);
				}

				return new Response(JSON.stringify(team), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			if (!teamId) {
				return new Response(
					JSON.stringify({ error: "team_id is required" }),
					{ status: 400, headers: corsHeaders }
				);
			}

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
							cf.prop_count AS propCount,
							(c.password IS NOT NULL) AS hasPassword
						FROM choreos c
						JOIN choreo_files cf
							ON cf.choreo_id = c.id
						WHERE cf.is_current = 1 AND c.team_id = ?
						ORDER BY cf.uploaded_at DESC;
						`
					).bind(teamId).all();
	
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
				if (!teamId) {
					return new Response(
						JSON.stringify({ error: "team_id is required" }),
						{ status: 400, headers: corsHeaders }
					);
				}
				
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

				const choreoCheck = await env.DB.prepare(
					"SELECT id FROM choreos WHERE id = ? AND team_id = ?"
				).bind(choreoId, teamId).first();

				if (!choreoCheck) {
					return new Response(
						JSON.stringify({ error: "Choreo not found" }),
						{ status: 404, headers: corsHeaders }
					);
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
					if (!choreoId) {
						return new Response(
							JSON.stringify({ error: "choreo_id is required" }),
							{ status: 400, headers: corsHeaders }
						);
					}

					if (!teamId) {
						return new Response(
							JSON.stringify({ error: "team_id is required" }),
							{ status: 400, headers: corsHeaders }
						);
					}

					const choreoCheck = await env.DB.prepare(
						"SELECT id FROM choreos WHERE id = ? AND team_id = ?"
					).bind(choreoId, teamId).first();

					if (!choreoCheck) {
						return new Response(
							JSON.stringify({ error: "Choreo not found" }),
							{ status: 404, headers: corsHeaders }
						);
					}

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

		if (url.pathname === "/api/auth/set-password" && request.method === "POST") {
			const body = await request.json() as { email: string; password: string };

			const user = await env.DB.prepare(`
				SELECT * FROM users WHERE email = ?
			`).bind(body.email).first();

			if (!user) {
				return new Response(
					JSON.stringify({ error: "User not found" }),
					{ status: 404, headers: corsHeaders }
				);
			}

			const hash = await hashPassword(body.password);

			await env.DB.prepare(`
				UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
			`).bind(hash, user.id).run();

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		if (url.pathname === "/api/auth/login" && request.method === "POST") {
			const body = await request.json() as { email: string; password: string, team_id: string };

			const user = await env.DB.prepare(`
				SELECT * FROM users WHERE email = ?
			`).bind(body.email).first();

			if (!user) {
				return new Response(
					JSON.stringify({ error: "Invalid email or password" }),
					{ status: 401, headers: corsHeaders }
				);
			}

			const passwordMatch = await verifyPassword(body.password, user.password_hash as string);

			if (!passwordMatch) {
				return new Response(
					JSON.stringify({ error: "Invalid email or password" }),
					{ status: 401, headers: corsHeaders }
				);
			}

			const teamMember = await env.DB.prepare(`
				SELECT * FROM team_members WHERE user_id = ? AND team_id = ? AND deleted = 0
			`).bind(user.id, body.team_id).first();

			if (!teamMember) {
				return new Response(
					JSON.stringify({ error: "User does not belong to this team" }),
					{ status: 403, headers: corsHeaders }
				);
			}

			const token = crypto.randomUUID();

			await env.DB.prepare(`
				INSERT INTO sessions (id, user_id, team_id, token, expires_at, created_at)
				VALUES (?, ?, ?, ?, datetime('now', '+30 days'), datetime('now'))
			`).bind(crypto.randomUUID(), user.id, teamMember.team_id, token).run();

			return new Response(JSON.stringify({ success: true, name: teamMember.name }), {
				status: 200,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
					"Set-Cookie": setSessionCookie(token),
				},
			});
		}

		if (url.pathname === "/api/choreos/verify" && request.method === "POST") {
			const body = await request.json() as { choreo_id: string; password: string, team_id: string };
			const password = await env.DB.prepare(`
				SELECT c.password
				FROM choreos c
				WHERE c.id = ? AND c.team_id = ?
			`).bind(body.choreo_id, body.team_id).first<{password: string}>();

			const passwordMatch = body.password === (password?.password ?? "");

			if (!passwordMatch) {
				return new Response(
					JSON.stringify({ error: "Invalid password" }),
					{ status: 401, headers: corsHeaders }
				);
			} else {
				return new Response("{}", {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
		}

		// Verify session token from cookie
		const cookie = request.headers.get('cookie');
		console.log("cookie header:", cookie);
		const token = cookie?.split(';').map(c => c.trim()).find(c => c.startsWith('token='))?.split('=')[1];
		console.log("extracted token:", token);

		if (!token) {
			return new Response(
				JSON.stringify({ error: "No session token provided. Please log in." }),
				{ status: 401, headers: corsHeaders }
			);
		}

		if (url.pathname === "/api/auth/logout" && request.method === "POST") {
			if (token) {
				await env.DB.prepare(
					"DELETE FROM sessions WHERE token = ?"
				).bind(token).run();
			}

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
					"Set-Cookie": "token=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/",
				},
			});
		}

		// Look up session in D1
		const session = await env.DB.prepare(`
			SELECT s.*, u.email, tm.id AS team_member_id, tm.role
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			JOIN team_members tm ON s.user_id = tm.user_id AND s.team_id = tm.team_id
			WHERE s.token = ? AND s.expires_at > datetime('now')
		`).bind(token).first();

		if (!session) {
			return new Response(
				JSON.stringify({ error: "Invalid or expired session. Please log in again." }),
				{ status: 401, headers: corsHeaders }
			);
		}

		if (url.pathname === "/api/auth/verify-user" && request.method === "GET") {
			await env.DB.prepare(`
				UPDATE sessions SET expires_at = datetime('now', '+30 days') WHERE token = ?
			`).bind(token).run();
			return new Response("{}", {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json", "Set-Cookie": setSessionCookie(token) },
			});
		}
		if (url.pathname === "/api/choreos/get-password" && request.method === "POST") {
			try {
				const data = await request.json() as any;
				const password = await env.DB.prepare(`
					SELECT c.password
					FROM choreos c
					WHERE c.id = ? AND c.team_id = ?
				`).bind(data.choreo_id as string, data.team_id as string).first<{password: string | null}>();
				return new Response(JSON.stringify(password), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json", "Set-Cookie": setSessionCookie(token) },
				});
			} catch (e) {
				console.log(e);
				return new Response(
					JSON.stringify({ error: `Internal server error: ${e}` }),
					{ status: 500, headers: corsHeaders }
				);
			}
		}

		if (request.method === "POST" && url.pathname === "/api/choreos/file") {
			try {
				const data = await request.json() as any;
				const file = data.file;
				const choreoId = data.choreo_id as string;
				const isNew = data.is_new as boolean;
				const name = data.name as string;
				const eventName = data.event_name as string | null;
				const eventStartDate = data.event_start_date as string | null;
				const eventEndDate = data.event_end_date as string | null;
				const stageWidth = data.stage_width as number;
				const stageLength = data.stage_length as number;
				const dancerCount = data.dancer_count as number;
				const propCount = data.prop_count as number;
				const password = data.password as string | null | undefined;
				const uploadedBy = session.team_member_id as string;

				if (!file || !choreoId || !name) {
					return new Response(
						JSON.stringify({ error: "file, choreo_id, and name are required" }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// get next version number
				let version = 1;
				if (!isNew) {
					console.log("getting version number");
					const current = await env.DB.prepare(
						"SELECT version FROM choreo_files WHERE choreo_id = ? AND is_current = 1"
					).bind(choreoId).first<{ version: number }>();

					if (!current) {
						console.log(`choreo not found: ${choreoId}`);
						return new Response(
							JSON.stringify({ error: "Choreo not found" }),
							{ status: 404, headers: corsHeaders }
						);
					}

					version = current.version + 1;

					// mark old version as not current
					console.log("set old choreo to not current");
					await env.DB.prepare(
						"UPDATE choreo_files SET is_current = 0 WHERE choreo_id = ? AND is_current = 1"
					).bind(choreoId).run()
					.catch(e => { throw new Error(`Failed to mark old version as not current: ${e}`) });
				}

				// upload to R2
				const r2Key = getFileName(choreoId, version.toString());
				console.log("upload choreo file");
				file["version"] = version;
				await env.BUCKET.put(r2Key, JSON.stringify(file), {
					httpMetadata: { contentType: "application/json" }
				})
				.catch(e => { throw new Error(`Failed to upload file to r2: ${e}`) });

				// upsert choreo
				console.log("upsert choreo");
				await env.DB.prepare(
					`INSERT INTO choreos (id, name, event_name, event_start_date, event_end_date, team_id, password)
					VALUES (?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(id) DO UPDATE SET
						name = excluded.name,
						event_name = excluded.event_name,
						event_start_date = excluded.event_start_date,
						event_end_date = excluded.event_end_date`
				).bind(choreoId, name, eventName, eventStartDate, eventEndDate, teamId, password ?? null).run()
				.catch(e => { throw new Error(`Failed to upsert choreo info into db: ${e}`) });

				// insert new choreo_file row
				const fileId = crypto.randomUUID();
				console.log("insert choreo file");
				await env.DB.prepare(
					`INSERT INTO choreo_files (id, choreo_id, version, is_current, stage_width, stage_length, dancer_count, prop_count, uploaded_by, uploaded_at)
					VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`
				).bind(fileId, choreoId, version, stageWidth, stageLength, dancerCount, propCount, uploadedBy, new Date().toISOString()).run()
				.catch(e => { throw new Error(`Failed to insert choreo file info into db: ${e}`) });

				return Response.json(
					{ newFile: file },
					{ status: isNew ? 201 : 200, headers: corsHeaders }
				);
			} catch (e) {
				console.log(e);
				return new Response(
					JSON.stringify({ error: `Internal server error: ${e}` }),
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
