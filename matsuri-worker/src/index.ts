import { Resend } from 'resend';
import { ErrorResponse } from './models/models';

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
	RESEND_API_KEY: string;
}

const getFileName = (id: string, version: string) => {return `${id}_v${version}.json`};
const setSessionCookie = (token: string) => `token=${token}; HttpOnly; Secure; SameSite=None; Max-Age=2592000; Path=/`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {

		const resend = new Resend(env.RESEND_API_KEY);

		const origin = request.headers.get("Origin");
		const corsHeaders = getCorsHeaders(origin);

		const getErrorResponse = (message: string, status: number = 400): Response => {
			console.error(`Error at ${request} - status: ${status} ; message: ${message}`);
			
			return new Response(
				JSON.stringify({message: message} as ErrorResponse), 
				{
					status: status,
					headers: { ...corsHeaders, "Content-Type": "application/problem+json" },
				}
			);
		}

		const sendEmail = async (emailAddress: string, subject: string, body: string): Promise<boolean> => {
			const { data, error } = await resend.emails.send({
				from: '隊列表作成アプリ <noreply@tairetsu.app>',
				to: emailAddress,
				subject: subject,
				html: body,
			});

			if (error) {
				throw Error(error.message);
			}

			return true;
		}

		if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
		const teamId = url.searchParams.get("team_id");

    if (request.method === "GET") {
			if (url.pathname === "/api/auth/verify-team") {
				const teamSlug = url.searchParams.get("team_slug");

				if (!teamSlug) {
					return getErrorResponse("team_slug is required");
				}

				const team = await env.DB.prepare(
					"SELECT id, name, slug FROM teams WHERE slug = ?"
				).bind(teamSlug).first();

				if (!team) {
					return getErrorResponse("Team not found", 404);
				}

				return new Response(JSON.stringify(team), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			if (url.pathname === "/api/choreos/summary") {
				if (!teamId) {
					return getErrorResponse("team_id is required");
				}
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
					return getErrorResponse(`Internal server error: ${(e as Error)?.message}`, 500);
				}
			} else if (url.pathname === "/api/choreos/file") {
				if (!teamId) {
					return getErrorResponse("team_id is required");
				}
				
				const choreoId = url.searchParams.get("choreo_id");
				const version = url.searchParams.get("version");
				
				if (choreoId === null) {
					return getErrorResponse("Choreo id must not be null");
				}

				if (version === null) {
					return getErrorResponse("Version must not be null");
				} else {
					if (!Number.isInteger(Number(version))) {
						return getErrorResponse("Version must be an int");
					}
				}

				const choreoCheck = await env.DB.prepare(
					"SELECT id FROM choreos WHERE id = ? AND team_id = ?"
				).bind(choreoId, teamId).first();

				if (!choreoCheck) {
					return getErrorResponse("Choreo not found", 404);
				}

				try {
					const r2Key = getFileName(choreoId, version);
					const object = await env.BUCKET.get(r2Key);
	
					if (!object) {
						return getErrorResponse("File not found", 404);
					}
	
					return new Response(object.body, {
						status: 200,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					});
				} catch (e: any) {
					return getErrorResponse(`Internal server error: ${(e as Error).message}`, 500);
				}
			} else if (url.pathname === "/api/choreos/file/current-version") {
				if (!teamId) {
					return getErrorResponse("team_id is required");
				}
				try {
					const choreoId = url.searchParams.get("choreo_id");
					if (!choreoId) {
						return getErrorResponse("choreo_id is required");
					}

					if (!teamId) {
						return getErrorResponse("team_id is required");
					}

					const choreoCheck = await env.DB.prepare(
						"SELECT id FROM choreos WHERE id = ? AND team_id = ?"
					).bind(choreoId, teamId).first();

					if (!choreoCheck) {
						return getErrorResponse("Choreo not found", 404);
					}

					const row = await env.DB.prepare(
						"SELECT version FROM choreo_files WHERE choreo_id = ? AND is_current = 1"
					).bind(choreoId).first<{ version: number }>();
	
					return Response.json(
						{ version: row?.version ?? 0 },
						{ status: 200, headers: corsHeaders }
					);
				} catch (e: any) {
					return getErrorResponse(`Internal server error: ${(e as Error).message}`, 500);
				}
			} else if (url.pathname === "/api/choreos/file/history/public") {
				const choreoId = url.searchParams.get("choreo_id");
				const teamId = url.searchParams.get("team_id");

				if (!choreoId || !teamId) {
					return getErrorResponse("choreo_id and team_id are required", 400);
				}

				const choreoCheck = await env.DB.prepare(
					"SELECT id FROM choreos WHERE id = ? AND team_id = ?"
				).bind(choreoId, teamId).first();

				if (!choreoCheck) {
					return getErrorResponse("Choreo not found", 404);
				}

				const { results } = await env.DB.prepare(`
					SELECT version, uploaded_at
					FROM choreo_files
					WHERE choreo_id = ?
					ORDER BY version DESC
				`).bind(choreoId).all();

				const history = results.map((r: any) => ({
					version: r.version,
					uploadedAt: r.uploaded_at,
					uploadedByName: undefined,
					uploadedByEmail: undefined,
				}));
				return Response.json(history, { status: 200, headers: corsHeaders });
			}
    }
		
		if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") {
			const body = await request.json() as { email: string, team_id: string };

			const user = await env.DB.prepare(
				"SELECT * FROM users WHERE email = ?"
			).bind(body.email).first();

			// Prevent user enumeration
			if (!user) {
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			const teamMember = await env.DB.prepare(
				"SELECT * FROM team_members WHERE user_id = ? AND team_id = ? AND deleted = 0"
			).bind(user.id, body.team_id).first();
			
			// Prevent user enumeration
			if (!teamMember) {
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			const code = (crypto.getRandomValues(new Uint32Array(1))[0] % 90000000 + 10000000).toString();
			const codeHash = await hashPassword(code);

			await env.DB.prepare(`
				DELETE FROM password_reset_tokens WHERE user_id = ?
			`).bind(user.id).run();

			await env.DB.prepare(`
				INSERT INTO password_reset_tokens (id, user_id, code_hash, expires_at, created_at)
				VALUES (?, ?, ?, datetime('now', '+10 minutes'), datetime('now'))
			`).bind(crypto.randomUUID(), user.id, codeHash).run();

			try {
				await sendEmail(body.email, 'パスワード再設定', `<p>パスワード再設定のリクエストを受け付けました。</p>
					<p>以下の認証コードを入力してください。</p>
					<p>${code}</p>
					<p>この認証コードの有効期限は10分です。</p>
					<br/>
			    <p>この操作に心当たりがない場合は、このメールを無視してください。</p>
					<br/>
			    <p>※このメールは自動送信されています。返信には対応しておりませんのでご了承ください。</p>
				`);
			} catch (e: any) {
				return getErrorResponse(`Failed to send email: ${(e as Error)?.message}`, 500);
			}

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		if (url.pathname === "/api/auth/reset-password" && request.method === "POST") {
			const body = await request.json() as { email: string; team_id: string, code: string; password: string };

			const user = await env.DB.prepare(
				"SELECT * FROM users WHERE email = ?"
			).bind(body.email).first();

			const invalidCodeErrorMessage = "認証コードまたはメールアドレスが正しくありません";

			if (!user) {
				return getErrorResponse(invalidCodeErrorMessage, 400);
			}

			const teamMember = await env.DB.prepare(
				"SELECT * FROM team_members WHERE user_id = ? AND team_id = ? AND deleted = 0"
			).bind(user.id, body.team_id).first();
			
			if (!teamMember) {
				return getErrorResponse(invalidCodeErrorMessage, 400);
			}

			const expiredToken = await env.DB.prepare(`
				SELECT * FROM password_reset_tokens 
				WHERE user_id = ? AND used_at IS NULL AND expires_at <= datetime('now')
			`).bind(user.id).first();

			if (expiredToken) {
				return getErrorResponse("コードの有効期限が切れています。新しいコードを再送してください", 400);
			}

			const resetToken = await env.DB.prepare(`
				SELECT * FROM password_reset_tokens 
				WHERE user_id = ? AND used_at IS NULL AND expires_at > datetime('now')
			`).bind(user.id).first();

			if (!resetToken) {
				return getErrorResponse(invalidCodeErrorMessage, 400);
			}

			if (resetToken.attempts as number >= 5) {
				return getErrorResponse("試行回数が多すぎます。新しいコードをリクエストしてください", 400);
			}

			const codeMatch = await verifyPassword(body.code, resetToken.code_hash as string);

			if (!codeMatch) {
				await env.DB.prepare(`
					UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?
				`).bind(resetToken.id).run();

				return getErrorResponse(invalidCodeErrorMessage, 400);
			}

			const newHash = await hashPassword(body.password);

			await env.DB.prepare(`
				UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
			`).bind(newHash, user.id).run();

			await env.DB.prepare(`
				UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?
			`).bind(resetToken.id).run();

			await env.DB.prepare(`
				DELETE FROM sessions WHERE user_id = ?
			`).bind(user.id).run();

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
				return getErrorResponse("Invalid email or password", 401);
			}

			const passwordMatch = await verifyPassword(body.password, user.password_hash as string);

			if (!passwordMatch) {
				return getErrorResponse("Invalid email or password", 401);
			}

			const teamMember = await env.DB.prepare(`
				SELECT * FROM team_members WHERE user_id = ? AND team_id = ? AND deleted = 0
			`).bind(user.id, body.team_id).first();

			if (!teamMember) {
				return getErrorResponse("User does not belong to this team", 403);
			}

			const token = crypto.randomUUID();

			await env.DB.prepare(`
				INSERT INTO sessions (id, user_id, team_id, token, expires_at, created_at)
				VALUES (?, ?, ?, ?, datetime('now', '+30 days'), datetime('now'))
			`).bind(crypto.randomUUID(), user.id, teamMember.team_id, token).run();

			return new Response(JSON.stringify({ success: true, teamMemberId: teamMember.id, name: teamMember.name, role: teamMember.role }), {
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
				return getErrorResponse("Invalid password", 401);
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
			return getErrorResponse("No session token provided. Please log in.", 401);
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
			SELECT s.*, u.email, u.name, tm.id AS team_member_id, tm.role as role
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			JOIN team_members tm ON s.user_id = tm.user_id AND s.team_id = tm.team_id
			WHERE s.token = ? AND s.expires_at > datetime('now')
		`).bind(token).first();

		if (!session) {
			return getErrorResponse("Invalid or expired session. Please log in again.", 401);
		}

		if (url.pathname === "/api/auth/verify-user" && request.method === "GET") {
			await env.DB.prepare(`
				UPDATE sessions SET expires_at = datetime('now', '+30 days') WHERE token = ?
			`).bind(token).run();
			return new Response(JSON.stringify({teamMemberId: session.team_member_id, name: session.name, role: session.role}), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json", "Set-Cookie": setSessionCookie(token) },
			});
		}

		if (url.pathname.startsWith("/api/team/")) {
			// users change their own name
			if (url.pathname === "/api/team/members/name" && request.method === "POST") {
				const body = await request.json() as { name: string };
	
				await env.DB.prepare(`
					UPDATE users SET name = ?, updated_at = datetime('now')
					WHERE id = ?
				`).bind(body.name, session.user_id).run();
	
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
	
			if (session.role !== "admin") {
				return getErrorResponse("Not permitted to add users.", 401);
			}

			if (url.pathname === "/api/team/invite-user" && request.method === "POST") {
				const body = await request.json() as { email: string; role: string };
	
				const team = await env.DB.prepare(
					"SELECT * FROM teams WHERE id = ?"
				).bind(session.team_id).first();
	
				if (!team) {
					return getErrorResponse("Team not found.", 404);
				}
	
				// Check if user already exists
				let user = await env.DB.prepare(
					"SELECT * FROM users WHERE email = ?"
				).bind(body.email).first();
	
				if (!user) {
					const userId = crypto.randomUUID();
					await env.DB.prepare(`
						INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
						VALUES (?, ?, '', '', datetime('now'), datetime('now'))
					`).bind(userId, body.email).run();
	
					user = await env.DB.prepare(
						"SELECT * FROM users WHERE id = ?"
					).bind(userId).first();
				}
	
				// Check if already a member
				const existingMember = await env.DB.prepare(
					"SELECT * FROM team_members WHERE user_id = ? AND team_id = ?"
				).bind(user!.id, session.team_id).first();
	
				if (existingMember) {
					if (existingMember.deleted === 0) {
						return getErrorResponse("User is already a member of this team", 409);
					} else {
						await env.DB.prepare(`
							UPDATE team_members SET deleted = 0, updated_at = datetime('now')
							WHERE id = ?
						`).bind(existingMember.id).run();
					}
				} else {
					await env.DB.prepare(`
						INSERT INTO team_members (id, team_id, user_id, role, deleted, created_at, updated_at)
						VALUES (?, ?, ?, ?, 0, datetime('now'), datetime('now'))
					`).bind(crypto.randomUUID(), session.team_id, user!.id, body.role).run();
				}
	
				try {
					await sendEmail(body.email, `${team.name}に招待されました`, `<p>${team.name}に招待されました。</p>
						<p><a href="https://tairetsu.app/${team.slug}">tairetsu.app/${team.slug}</a> にアクセスする</p>
						<p>初めてご利用の方は、「パスワードをお忘れの方はこちら」からパスワードを設定してください。</p>
						<p>ご不明な点がございましたら、チームの管理者にお問い合わせください。</p>
						<br/>
						<p>※このメールは自動送信されています。返信には対応しておりませんのでご了承ください。</p>
					`);
				} catch (e: any) {
					return getErrorResponse(`Failed to send email: ${(e as Error)?.message}`, 500);
				}
	
				return new Response(JSON.stringify({ success: true }), {
					status: 201,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
	
			if (url.pathname === "/api/team/members" && request.method === "GET") {
				const { results } = await env.DB.prepare(`
					SELECT tm.id, u.name, tm.role, u.email
					FROM team_members tm
					JOIN users u ON tm.user_id = u.id
					WHERE tm.team_id = ? AND tm.deleted = 0
				`).bind(session.team_id).all();

				return new Response(JSON.stringify(results), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
	
			if (url.pathname === "/api/team/members/role" && request.method === "POST") {
				const body = await request.json() as { member_id: string; role: string };
	
				await env.DB.prepare(`
					UPDATE team_members SET role = ?, updated_at = datetime('now')
					WHERE id = ? AND team_id = ?
				`).bind(body.role, body.member_id, session.team_id).run();
	
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
	
			if (url.pathname === "/api/team/members/remove" && request.method === "POST") {
				const body = await request.json() as { member_id: string };
				const results = await env.DB.prepare(`
					SELECT user_id FROM team_members
					WHERE id = ? AND team_id = ?
				`).bind(body.member_id, session.team_id).first();

				await env.DB.prepare(`
					UPDATE team_members SET deleted = 1, updated_at = datetime('now')
					WHERE id = ? AND team_id = ?
				`).bind(body.member_id, session.team_id).run();

				await env.DB.prepare(`
					DELETE FROM sessions WHERE user_id = ? AND team_id = ?
				`).bind(results?.user_id, session.team_id).run();
	
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
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
				return getErrorResponse(`Internal server error: ${(e as Error).message}`, 500);
			}
		}

		if (url.pathname === "/api/choreos/file/history" && request.method === "GET") {
			const choreoId = url.searchParams.get("choreo_id");

			if (!choreoId) {
				return getErrorResponse("choreo_id is required", 400);
			}

			const choreoCheck = await env.DB.prepare(
				"SELECT id FROM choreos WHERE id = ? AND team_id = ?"
			).bind(choreoId, session.team_id).first();

			if (!choreoCheck) {
				return getErrorResponse("Choreo not found", 404);
			}

			const { results } = await env.DB.prepare(`
				SELECT 
					cf.version,
					cf.uploaded_at,
					u.name,
					u.email
				FROM choreo_files cf
				LEFT JOIN team_members tm ON cf.uploaded_by = tm.id
				LEFT JOIN users u ON tm.user_id = u.id
				WHERE cf.choreo_id = ?
				ORDER BY cf.version DESC
			`).bind(choreoId).all();

			const history = results.map((r: any) => ({
				version: r.version,
				uploadedAt: r.uploaded_at,
				uploadedByName: r.name?.trim(),
				uploadedByEmail: r.email,
			}));

			return Response.json(history, { status: 200, headers: corsHeaders });
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
					return getErrorResponse("file, choreo_id, and name are required", 400);
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
						return getErrorResponse("Choreo not found", 400);
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
						event_end_date = excluded.event_end_date,
						password = excluded.password`
				).bind(choreoId, name, eventName, eventStartDate, eventEndDate, session.team_id, password ?? null).run()
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
				return getErrorResponse(`Internal server error: ${(e as Error).message}`, 500);
			}
		}

		return getErrorResponse(`Endpoint not found`, 404);
  }
};
