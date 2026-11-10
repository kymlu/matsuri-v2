import { Resend } from 'resend';
import { ErrorResponse, RosterKind, RosterList, RosterResponse } from './models/models';

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

const ROSTER_NAME_LENGTH = 15; // same as SHORT_NAME_LENGTH in the app, since a roster name becomes a dancer or prop name
const ROSTER_CATEGORY_LENGTH = 10;
const ROSTER_MAX_ADD = 200;
const ROSTER_MAX_NAMES = 1000;
const ROSTER_MAX_CATEGORIES = 100;
const ROSTER_MAX_LINK_PAIRS = 5000; // far beyond real use: 1000 names × several categories
// Used only to stop duplicates: full/half-width and stray spaces count as the same name.
const toNameKey = (name: string) => name.normalize("NFKC").trim();

const isStringArray = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every(x => typeof x === "string");

// [name id, category id] pairs, as sent to /api/roster/links.
const isPairArray = (value: unknown): value is [string, string][] =>
	Array.isArray(value) && value.every(x => Array.isArray(x) && x.length === 2 && typeof x[0] === "string" && typeof x[1] === "string");

const isUniqueConstraintError = (e: unknown) => String((e as Error)?.message ?? e).includes("UNIQUE constraint failed");

// The columns of each row in a JSON array of arrays, for use with json_each.
const jsonColumns = (count: number) =>
	Array.from({ length: count }, (_, i) => `json_extract(value, '$[${i}]')`).join(", ");

// One INSERT for any number of rows. The rows go in as a single JSON parameter, which stays clear of
// D1's 100 bound parameters per query and keeps a large paste to one statement.
const prepareInsertRows = (db: D1Database, insertInto: string, rows: unknown[][]): D1PreparedStatement[] =>
	rows.length === 0
		? []
		: [db.prepare(`${insertInto} SELECT ${jsonColumns(rows[0].length)} FROM json_each(?)`).bind(JSON.stringify(rows))];

// For WHERE id IN (...) with any number of ids, as a single bound parameter.
const IDS_IN_JSON = "(SELECT value FROM json_each(?))";

const ROSTER_KINDS = ["dancer", "prop"] as const;
const isRosterKind = (value: unknown): value is RosterKind => ROSTER_KINDS.includes(value as RosterKind);

const PROP_MIN_DIMENSION = 0.5; // same as MIN_PROP_DIMENSION / MAX_PROP_DIMENSION in the app
const PROP_MAX_DIMENSION = 20;
const isPropDimension = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value) && value >= PROP_MIN_DIMENSION && value <= PROP_MAX_DIMENSION;
const isHexColor = (value: unknown) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

const getRoster = async (db: D1Database, teamId: string): Promise<RosterResponse> => {
	const [categories, names, links] = await Promise.all([
		db.prepare(`
			SELECT id, name, kind FROM roster_categories
			WHERE team_id = ? AND deleted = 0
			ORDER BY sort_order
		`).bind(teamId).all<{ id: string, name: string, kind: RosterKind }>(),
		db.prepare(`
			SELECT id, name, kind, default_length, default_width, default_color FROM roster_names
			WHERE team_id = ? AND deleted = 0
		`).bind(teamId).all<{ id: string, name: string, kind: RosterKind, default_length: number | null, default_width: number | null, default_color: string | null }>(),
		db.prepare(`
			SELECT l.name_id, l.category_id
			FROM roster_name_categories l
			JOIN roster_categories c ON c.id = l.category_id
			WHERE c.team_id = ? AND c.deleted = 0
			ORDER BY c.sort_order
		`).bind(teamId).all<{ name_id: string, category_id: string }>(),
	]);

	const categoryIdsByName = new Map<string, string[]>();
	for (const link of links.results) {
		categoryIdsByName.set(link.name_id, [...(categoryIdsByName.get(link.name_id) ?? []), link.category_id]);
	}

	const listOf = (kind: RosterKind): RosterList => ({
		categories: categories.results.filter(c => c.kind === kind).map(c => ({ id: c.id, name: c.name })),
		names: names.results.filter(n => n.kind === kind).map(n => ({
			id: n.id,
			name: n.name,
			categoryIds: categoryIdsByName.get(n.id) ?? [],
			...(n.default_length !== null ? { length: n.default_length } : {}),
			...(n.default_width !== null ? { width: n.default_width } : {}),
			...(n.default_color !== null ? { color: n.default_color } : {}),
		})),
	});

	return { dancers: listOf("dancer"), props: listOf("prop") };
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {

		const resend = new Resend(env.RESEND_API_KEY);

		const origin = request.headers.get("Origin");
		const corsHeaders = getCorsHeaders(origin);

		const getSuccessResponse = (
			body: any = { success: true },
			status: 200 | 201 | 204 = 200,
			setCookie?: any,
		): Response => {
			console.info(`Successfully resolved ${request.url} - status: ${status}`);
			const headers = new Headers(corsHeaders);
			headers.set("Content-Type", "application/json");
			if (setCookie) {
				headers.set("Set-Cookie", setCookie);
			}

			return new Response(
				JSON.stringify(body), 
				{
					status: status,
					headers: headers,
				}
			);
		}

		const getErrorResponse = (message: string, status: number = 400): Response => {
			console.error(`Error at ${request.url} - status: ${status} ; message: ${message}`);
			
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
				from: '隊列表作成アプリ <accounts@tairetsu.app>',
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

		const match = url.pathname.match(/^\/api\/manifest\/(.+)$/);

		if (match) {
			const slug = match[1];

      const manifest = {
				short_name: "隊列アプリ",
				name: `${slug ? slug + " | " : ""}隊列作成アプリ`,
				icons: [
					{ src: "/favicon.ico", sizes: "64x64 32x32 24x24 16x16", type: "image/x-icon" },
					{ src: "/logo192.png", type: "image/png", sizes: "192x192" },
					{ src: "/logo512.png", type: "image/png", sizes: "512x512" }
				],
				start_url: `/${slug}`,
				scope: "/",
				display: "standalone",
				theme_color: "#AB1010",
				background_color: "#ffffff"
			};

      return new Response(JSON.stringify(manifest), {
        headers: {
          "Content-Type": "application/manifest+json",
          "Cache-Control": "public, max-age=3600"
        }
      });
		}

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

				return getSuccessResponse(team);
			}

			if (url.pathname === "/api/auth/verify-invite") {
				const rawToken = url.searchParams.get("setup");

				if (!rawToken) {
					return getErrorResponse("Invalid invite link", 400);
				}

				const { results } = await env.DB.prepare(`
					SELECT it.*, u.email, t.name AS team_name, t.slug AS team_slug
					FROM invite_tokens it
					JOIN users u ON it.user_id = u.id
					JOIN teams t ON it.team_id = t.id
					WHERE it.used_at IS NULL AND it.team_id = ?
				`).bind(teamId).all();

				const match = await Promise.all(
					results.map(async (row: any) => {
						const valid = await verifyPassword(rawToken, row.token_hash);
						return valid ? row : null;
					})
				).then(results => results.find(r => r !== null));

				if (!match) {
					return getErrorResponse("Invalid or already used invite link", 400);
				}

				return new Response(JSON.stringify({
					email: match.email
				}), {
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
	
					return getSuccessResponse(results);
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
	
					return getSuccessResponse({ version: row?.version ?? 0 });
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
				}));
				return getSuccessResponse(history);
			}
    }
		
		if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") {
			const body = await request.json() as { email: string, team_id: string };

			const user = await env.DB.prepare(
				"SELECT * FROM users WHERE email = ?"
			).bind(body.email).first();

			// Prevent user enumeration
			if (!user) {
				return getSuccessResponse();
			}

			const teamMember = await env.DB.prepare(
				"SELECT * FROM team_members WHERE user_id = ? AND team_id = ? AND deleted = 0"
			).bind(user.id, body.team_id).first();
			
			// Prevent user enumeration
			if (!teamMember) {
				return getSuccessResponse();
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

			return getSuccessResponse();
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

			return getSuccessResponse();
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

			return getSuccessResponse(
				{ success: true, teamMemberId: teamMember.id, name: user.name, role: teamMember.role },
				200, 
				setSessionCookie(token)
			);
		}

		if (url.pathname === "/api/auth/accept-invite" && request.method === "POST") {
			const body = await request.json() as { team_id: string, setup: string; password: string };

			if (!body.setup || !body.password) {
				return getErrorResponse("Invalid request", 400);
			}

			const { results } = await env.DB.prepare(`
				SELECT it.*, u.id AS user_id, u.name as user_name, t.id AS team_id, t.slug AS team_slug
				FROM invite_tokens it
				JOIN users u ON it.user_id = u.id
				JOIN teams t ON it.team_id = t.id
				WHERE it.used_at IS NULL AND it.team_id = ?
			`).bind(body.team_id).all();

			const match = await Promise.all(
				results.map(async (row: any) => {
					const valid = await verifyPassword(body.setup, row.token_hash);
					return valid ? row : null;
				})
			).then(r => r.find(x => x !== null));

			if (!match) {
				return getErrorResponse("このリンクは無効です。管理者にお問い合わせください。", 400);
			}

			const newHash = await hashPassword(body.password);

			await env.DB.prepare(`
				UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
			`).bind(newHash, match.user_id).run();

			await env.DB.prepare(`
				UPDATE invite_tokens SET used_at = datetime('now') WHERE id = ?
			`).bind(match.id).run();

			const teamMember = await env.DB.prepare(`
				SELECT * FROM team_members WHERE user_id = ? AND team_id = ? AND deleted = 0
			`).bind(match.user_id, match.team_id).first();

			if (!teamMember) {
				return getErrorResponse("User no longer belongs to this team", 403);
			}

			const token = crypto.randomUUID();

			await env.DB.prepare(`
				INSERT INTO sessions (id, user_id, team_id, token, expires_at, created_at)
				VALUES (?, ?, ?, ?, datetime('now', '+30 days'), datetime('now'))
			`).bind(crypto.randomUUID(), match.user_id, match.team_id, token).run();

			return getSuccessResponse(
				{ success: true, teamMemberId: teamMember.id, name: match.user_name, role: teamMember.role },
				200, 
				setSessionCookie(token)
			);
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
				return getSuccessResponse();
			}
		}

		// Verify session token from cookie
		const cookie = request.headers.get('cookie');
		const token = cookie?.split(';').map(c => c.trim()).find(c => c.startsWith('token='))?.split('=')[1];

		if (!token) {
			return getErrorResponse("No session token provided. Please log in.", 401);
		}

		if (url.pathname === "/api/auth/logout" && request.method === "POST") {
			if (token) {
				await env.DB.prepare(
					"DELETE FROM sessions WHERE token = ?"
				).bind(token).run();
			}

			return getSuccessResponse({ success: true }, 
				200,
				"token=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/"
			);
		}

		// Look up session in D1
		const session = await env.DB.prepare(`
			SELECT s.*, u.email, u.name, tm.id AS team_member_id, tm.role as role
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			JOIN team_members tm ON s.user_id = tm.user_id AND s.team_id = tm.team_id
			WHERE s.token = ? AND s.expires_at > datetime('now') AND tm.team_id = ?
		`).bind(token, teamId).first();

		if (!session) {
			return getErrorResponse("Invalid or expired session. Please log in again.", 401);
		}

		if (url.pathname === "/api/auth/verify-user" && request.method === "GET") {
			await env.DB.prepare(`
				UPDATE sessions SET expires_at = datetime('now', '+30 days') WHERE token = ?
			`).bind(token).run();
			return getSuccessResponse(
				{teamMemberId: session.team_member_id, name: session.name, role: session.role},
				200,
				setSessionCookie(token)
			);
		}

		// Outside /api/team/, which only admins can use: editors maintain the roster too.
		if (url.pathname === "/api/roster" || url.pathname.startsWith("/api/roster/")) {
			if (session.role !== "admin" && session.role !== "editor") {
				return getErrorResponse("Not permitted to use the roster.", 403);
			}

			const rosterTeamId = session.team_id as string;
			const readBody = () => request.json().catch(() => null) as Promise<Record<string, unknown> | null>;
			// Categories belong to one kind: a prop name can't take a dancer category.
			const getLiveCategoryIds = async (kind: RosterKind) => {
				const { results } = await env.DB.prepare(
					"SELECT id FROM roster_categories WHERE team_id = ? AND kind = ? AND deleted = 0"
				).bind(rosterTeamId, kind).all<{ id: string }>();
				return new Set(results.map(r => r.id));
			};

			try {
				if (url.pathname === "/api/roster" && request.method === "GET") {
					return getSuccessResponse(await getRoster(env.DB, rosterTeamId));
				}

				// One request covers a single name, a paste of many, and adding categories to names already in the roster.
				if (url.pathname === "/api/roster/names/add" && request.method === "POST") {
					const body = await readBody();
					if (!isStringArray(body?.names) || !isStringArray(body?.category_ids)) {
						return getErrorResponse("names and category_ids must be arrays of strings.");
					}
					if (!isRosterKind(body.kind)) {
						return getErrorResponse("kind must be dancer or prop.");
					}
					const kind = body.kind;

					const lines = body.names.flatMap(n => n.split(/\r?\n/));
					// Blank lines and repeats are dropped below, so only distinct names count toward the limit.
					if (new Set(lines.map(toNameKey).filter(key => key !== "")).size > ROSTER_MAX_ADD) {
						return getErrorResponse(`At most ${ROSTER_MAX_ADD} names can be added at once.`);
					}

					const categoryIds = [...new Set(body.category_ids)];
					const liveCategoryIds = await getLiveCategoryIds(kind);
					if (categoryIds.some(id => !liveCategoryIds.has(id))) {
						return getErrorResponse("Unknown category.");
					}

					const { results: existingNames } = await env.DB.prepare(
						"SELECT id, name_key FROM roster_names WHERE team_id = ? AND kind = ? AND deleted = 0"
					).bind(rosterTeamId, kind).all<{ id: string, name_key: string }>();
					const { results: existingLinks } = await env.DB.prepare(`
						SELECT l.name_id, l.category_id
						FROM roster_name_categories l
						JOIN roster_names n ON n.id = l.name_id
						WHERE n.team_id = ? AND n.kind = ? AND n.deleted = 0
					`).bind(rosterTeamId, kind).all<{ name_id: string, category_id: string }>();
					const idByKey = new Map(existingNames.map(n => [n.name_key, n.id]));
					const linkSet = new Set(existingLinks.map(l => `${l.name_id}:${l.category_id}`));

					const seenKeys = new Set<string>();
					const newNames: unknown[][] = [];
					const newLinks: unknown[][] = [];
					const skipped: { name: string, reason: "too_long" | "exists" }[] = [];
					let updated = 0;

					for (const line of lines) {
						const name = line.trim();
						const key = toNameKey(name);
						if (key === "" || seenKeys.has(key)) {
							continue;
						}
						seenKeys.add(key);

						if (name.length > ROSTER_NAME_LENGTH) {
							skipped.push({ name, reason: "too_long" });
							continue;
						}

						const existingId = idByKey.get(key);
						if (existingId) {
							const missing = categoryIds.filter(c => !linkSet.has(`${existingId}:${c}`));
							if (missing.length === 0) {
								skipped.push({ name, reason: "exists" });
							} else {
								newLinks.push(...missing.map(c => [existingId, c]));
								updated++;
							}
						} else {
							const id = crypto.randomUUID();
							newNames.push([id, rosterTeamId, kind, name, key, session.team_member_id]);
							newLinks.push(...categoryIds.map(c => [id, c]));
						}
					}

					if (existingNames.length + newNames.length > ROSTER_MAX_NAMES) {
						return getErrorResponse(`A roster can have at most ${ROSTER_MAX_NAMES} names of each kind.`);
					}

					const statements = [
						...prepareInsertRows(env.DB, "INSERT INTO roster_names (id, team_id, kind, name, name_key, created_by)", newNames),
						...prepareInsertRows(env.DB, "INSERT OR IGNORE INTO roster_name_categories (name_id, category_id)", newLinks),
					];
					if (statements.length > 0) {
						await env.DB.batch(statements);
					}

					return getSuccessResponse({
						roster: await getRoster(env.DB, rosterTeamId),
						added: newNames.length,
						updated,
						skipped,
					});
				}

				// Replaces the name and its whole set of categories. For props, length, width and color set the
				// defaults (null clears one; leaving it out keeps it).
				if (url.pathname === "/api/roster/names/update" && request.method === "POST") {
					const body = await readBody();
					if (typeof body?.id !== "string" || typeof body?.name !== "string" || !isStringArray(body?.category_ids)) {
						return getErrorResponse("id, name and category_ids are required.");
					}
					const id = body.id;

					const current = await env.DB.prepare(
						"SELECT id, kind FROM roster_names WHERE id = ? AND team_id = ? AND deleted = 0"
					).bind(id, rosterTeamId).first<{ id: string, kind: RosterKind }>();
					if (!current) {
						return getErrorResponse("Name not found.", 404);
					}
					const kind = current.kind;

					const defaults = {
						default_length: body.length,
						default_width: body.width,
						default_color: body.color,
					};
					const givenDefaults = Object.entries(defaults).filter(([, value]) => value !== undefined);
					if (kind !== "prop" && givenDefaults.length > 0) {
						return getErrorResponse("Only prop names have a default size and colour.");
					}
					if ((body.length !== undefined && body.length !== null && !isPropDimension(body.length)) ||
						(body.width !== undefined && body.width !== null && !isPropDimension(body.width))) {
						return getErrorResponse(`Sizes must be ${PROP_MIN_DIMENSION}–${PROP_MAX_DIMENSION}.`);
					}
					if (body.color !== undefined && body.color !== null && !isHexColor(body.color)) {
						return getErrorResponse("color must be #RRGGBB.");
					}

					const name = body.name.trim();
					const key = toNameKey(name);
					if (key === "" || name.length > ROSTER_NAME_LENGTH) {
						return getErrorResponse(`Names must be 1–${ROSTER_NAME_LENGTH} characters.`);
					}

					const categoryIds = [...new Set(body.category_ids)];
					const liveCategoryIds = await getLiveCategoryIds(kind);
					if (categoryIds.some(c => !liveCategoryIds.has(c))) {
						return getErrorResponse("Unknown category.");
					}

					const conflict = await env.DB.prepare(
						"SELECT id FROM roster_names WHERE team_id = ? AND kind = ? AND deleted = 0 AND name_key = ? AND id != ?"
					).bind(rosterTeamId, kind, key, id).first();
					if (conflict) {
						return getErrorResponse("Already in the roster.", 409);
					}

					await env.DB.batch([
						env.DB.prepare(`
							UPDATE roster_names SET name = ?, name_key = ?, ${givenDefaults.map(([column]) => `${column} = ?, `).join("")}updated_at = datetime('now')
							WHERE id = ?
						`).bind(name, key, ...givenDefaults.map(([, value]) => value), id),
						env.DB.prepare("DELETE FROM roster_name_categories WHERE name_id = ?").bind(id),
						...prepareInsertRows(env.DB, "INSERT INTO roster_name_categories (name_id, category_id)", categoryIds.map(c => [id, c])),
					]);

					return getSuccessResponse(await getRoster(env.DB, rosterTeamId));
				}

				// Sets or clears the default size and colour of many prop names at once. Each item gives its own values
				// (null clears one; leaving it out keeps it). Reports which names actually changed.
				if (url.pathname === "/api/roster/names/defaults" && request.method === "POST") {
					const body = await readBody();
					const items: unknown = body?.items;
					if (!Array.isArray(items) || items.length === 0 || items.length > ROSTER_MAX_NAMES ||
						!items.every(i => typeof i === "object" && i !== null && typeof i.id === "string")) {
						return getErrorResponse(`items must be 1–${ROSTER_MAX_NAMES} objects with an id.`);
					}
					const ids = items.map(i => i.id as string);
					if (new Set(ids).size !== ids.length) {
						return getErrorResponse("Each name can appear only once.");
					}
					for (const item of items) {
						if ((item.length !== undefined && item.length !== null && !isPropDimension(item.length)) ||
							(item.width !== undefined && item.width !== null && !isPropDimension(item.width))) {
							return getErrorResponse(`Sizes must be ${PROP_MIN_DIMENSION}–${PROP_MAX_DIMENSION}.`);
						}
						if (item.color !== undefined && item.color !== null && !isHexColor(item.color)) {
							return getErrorResponse("color must be #RRGGBB.");
						}
					}

					type Defaults = { id: string, kind: RosterKind, default_length: number | null, default_width: number | null, default_color: string | null };
					const { results: current } = await env.DB.prepare(`
						SELECT id, kind, default_length, default_width, default_color FROM roster_names
						WHERE team_id = ? AND deleted = 0 AND id IN ${IDS_IN_JSON}
					`).bind(rosterTeamId, JSON.stringify(ids)).all<Defaults>();
					if (current.length !== ids.length) {
						return getErrorResponse("Name not found.", 404);
					}
					if (current.some(n => n.kind !== "prop")) {
						return getErrorResponse("Only prop names have a default size and colour.");
					}

					const byId = new Map(current.map(n => [n.id, n]));
					const fields = [["length", "default_length"], ["width", "default_width"], ["color", "default_color"]] as const;
					// Colours are compared ignoring case, as in the app.
					const same = (a: unknown, b: unknown) =>
						typeof a === "string" && typeof b === "string" ? a.toLowerCase() === b.toLowerCase() : a === b;
					const changed = items.filter(item => {
						const old = byId.get(item.id)!;
						return fields.some(([field, column]) => item[field] !== undefined && !same(item[field], old[column]));
					});

					if (changed.length > 0) {
						// json_type is NULL for a missing field (keep) and 'null' for a JSON null (clear).
						const setColumn = (field: string, column: string) =>
							`${column} = CASE WHEN json_type(j.value, '$.${field}') IS NULL THEN ${column} ELSE json_extract(j.value, '$.${field}') END`;
						await env.DB.prepare(`
							UPDATE roster_names SET ${fields.map(([field, column]) => setColumn(field, column)).join(", ")}, updated_at = datetime('now')
							FROM json_each(?) AS j
							WHERE roster_names.id = json_extract(j.value, '$.id') AND roster_names.team_id = ?
						`).bind(JSON.stringify(changed), rosterTeamId).run();
					}

					return getSuccessResponse({ roster: await getRoster(env.DB, rosterTeamId), changed: changed.map(item => item.id as string) });
				}

				// Adds and removes name–category links. Takes exact pairs and reports the ones that actually changed,
				// so the app can count just those: adding 旗士 to 3 people when 1 already had it changes 2.
				if (url.pathname === "/api/roster/links" && request.method === "POST") {
					const body = await readBody();
					if (!isPairArray(body?.add) || !isPairArray(body?.remove)) {
						return getErrorResponse("add and remove must be arrays of [name id, category id].");
					}
					const pairKey = ([nameId, categoryId]: [string, string]) => `${nameId}:${categoryId}`;
					const unique = (pairs: [string, string][]) => [...new Map(pairs.map(p => [pairKey(p), p])).values()];
					const add = unique(body.add);
					const remove = unique(body.remove);
					if (add.length + remove.length > ROSTER_MAX_LINK_PAIRS) {
						return getErrorResponse(`At most ${ROSTER_MAX_LINK_PAIRS} links can be changed at once.`);
					}
					const removeKeys = new Set(remove.map(pairKey));
					if (add.some(p => removeKeys.has(pairKey(p)))) {
						return getErrorResponse("A link can't be both added and removed.");
					}

					const [{ results: names }, { results: categories }, { results: links }] = await Promise.all([
						env.DB.prepare("SELECT id, kind FROM roster_names WHERE team_id = ? AND deleted = 0")
							.bind(rosterTeamId).all<{ id: string, kind: RosterKind }>(),
						env.DB.prepare("SELECT id, kind FROM roster_categories WHERE team_id = ? AND deleted = 0")
							.bind(rosterTeamId).all<{ id: string, kind: RosterKind }>(),
						env.DB.prepare(`
							SELECT l.name_id, l.category_id
							FROM roster_name_categories l
							JOIN roster_names n ON n.id = l.name_id
							WHERE n.team_id = ? AND n.deleted = 0
						`).bind(rosterTeamId).all<{ name_id: string, category_id: string }>(),
					]);
					const nameKinds = new Map(names.map(n => [n.id, n.kind]));
					const categoryKinds = new Map(categories.map(c => [c.id, c.kind]));
					for (const [nameId, categoryId] of [...add, ...remove]) {
						if (!nameKinds.has(nameId) || !categoryKinds.has(categoryId)) {
							return getErrorResponse("Name or category not found.", 404);
						}
						if (nameKinds.get(nameId) !== categoryKinds.get(categoryId)) {
							return getErrorResponse("A name and its category must be the same kind.");
						}
					}

					const linked = new Set(links.map(l => `${l.name_id}:${l.category_id}`));
					const added = add.filter(p => !linked.has(pairKey(p)));
					const removed = remove.filter(p => linked.has(pairKey(p)));

					const statements = [
						...prepareInsertRows(env.DB, "INSERT OR IGNORE INTO roster_name_categories (name_id, category_id)", added),
						...(removed.length === 0 ? [] : [env.DB.prepare(`
							DELETE FROM roster_name_categories
							WHERE (name_id, category_id) IN (SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?))
						`).bind(JSON.stringify(removed))]),
					];
					if (statements.length > 0) {
						await env.DB.batch(statements);
					}

					return getSuccessResponse({ roster: await getRoster(env.DB, rosterTeamId), added, removed });
				}

				// Brings back names removed by names/remove, with their categories and prop defaults.
				// A name whose spelling has been added again since stays deleted and is reported as skipped,
				// since two live names can't share a spelling.
				if (url.pathname === "/api/roster/names/restore" && request.method === "POST") {
					const body = await readBody();
					if (!isStringArray(body?.ids) || body.ids.length === 0 || body.ids.length > ROSTER_MAX_NAMES) {
						return getErrorResponse(`ids must be 1–${ROSTER_MAX_NAMES} name ids.`);
					}
					const ids = [...new Set(body.ids)];

					const { results: candidates } = await env.DB.prepare(`
						SELECT r.id, r.kind, r.name_key FROM roster_names r
						WHERE r.team_id = ? AND r.deleted = 1 AND r.id IN ${IDS_IN_JSON}
						AND NOT EXISTS (
							SELECT 1 FROM roster_names l
							WHERE l.team_id = r.team_id AND l.kind = r.kind AND l.name_key = r.name_key AND l.deleted = 0
						)
					`).bind(rosterTeamId, JSON.stringify(ids)).all<{ id: string, kind: RosterKind, name_key: string }>();
					// Two deleted rows with one spelling can't both come back either: keep the first asked for.
					const order = new Map(ids.map((id, i) => [id, i]));
					const byKey = new Map<string, string>();
					for (const c of [...candidates].sort((a, b) => order.get(a.id)! - order.get(b.id)!)) {
						const key = `${c.kind}:${c.name_key}`;
						if (!byKey.has(key)) {
							byKey.set(key, c.id);
						}
					}
					const restored = [...byKey.values()];

					if (restored.length > 0) {
						const { results: counts } = await env.DB.prepare(`
							SELECT kind, COUNT(*) AS count FROM roster_names WHERE team_id = ? AND deleted = 0 GROUP BY kind
						`).bind(rosterTeamId).all<{ kind: RosterKind, count: number }>();
						const restoredKinds = candidates.filter(c => restored.includes(c.id)).map(c => c.kind);
						if (counts.some(c => c.count + restoredKinds.filter(k => k === c.kind).length > ROSTER_MAX_NAMES)) {
							return getErrorResponse(`A roster can have at most ${ROSTER_MAX_NAMES} names of each kind.`);
						}
						await env.DB.prepare(`
							UPDATE roster_names SET deleted = 0, updated_at = datetime('now')
							WHERE team_id = ? AND id IN ${IDS_IN_JSON}
						`).bind(rosterTeamId, JSON.stringify(restored)).run();
					}

					return getSuccessResponse({
						roster: await getRoster(env.DB, rosterTeamId),
						restored,
						skipped: ids.filter(id => !restored.includes(id)),
					});
				}

				// One name ({ id }, from the edit dialog) or several ({ ids }, from selection mode).
				// Several is all or nothing, so the count the user confirmed is what gets deleted.
				if (url.pathname === "/api/roster/names/remove" && request.method === "POST") {
					const body = await readBody();
					if (isStringArray(body?.ids)) {
						const ids = [...new Set(body.ids)];
						if (ids.length === 0 || ids.length > ROSTER_MAX_NAMES) {
							return getErrorResponse(`ids must be 1–${ROSTER_MAX_NAMES} name ids.`);
						}
						const { results: live } = await env.DB.prepare(`
							SELECT id FROM roster_names WHERE team_id = ? AND deleted = 0 AND id IN ${IDS_IN_JSON}
						`).bind(rosterTeamId, JSON.stringify(ids)).all<{ id: string }>();
						if (live.length !== ids.length) {
							return getErrorResponse("Name not found.", 404);
						}
						// Report what this request actually removed: if another editor removed one of these in the
						// meantime, undoing this mustn't bring theirs back.
						const { results: removed } = await env.DB.prepare(`
							UPDATE roster_names SET deleted = 1, updated_at = datetime('now')
							WHERE team_id = ? AND deleted = 0 AND id IN ${IDS_IN_JSON}
							RETURNING id
						`).bind(rosterTeamId, JSON.stringify(ids)).all<{ id: string }>();
						const removedIds = new Set(removed.map(r => r.id));
						return getSuccessResponse({ roster: await getRoster(env.DB, rosterTeamId), removed: ids.filter(id => removedIds.has(id)) });
					}
					if (typeof body?.id !== "string") {
						return getErrorResponse("id or ids is required.");
					}

					const result = await env.DB.prepare(`
						UPDATE roster_names SET deleted = 1, updated_at = datetime('now')
						WHERE id = ? AND team_id = ? AND deleted = 0
					`).bind(body.id, rosterTeamId).run();
					if (result.meta.changes === 0) {
						return getErrorResponse("Name not found.", 404);
					}

					return getSuccessResponse(await getRoster(env.DB, rosterTeamId));
				}

				// The categories dialog saves the whole list at once, in display order.
				if (url.pathname === "/api/roster/categories/save" && request.method === "POST") {
					const body = await readBody();
					const categories = body?.categories;
					const deletedIds = body?.deleted_ids;
					if (!Array.isArray(categories) || !isStringArray(deletedIds) || !categories.every(c =>
						typeof c?.name === "string" && (c.id === undefined || typeof c.id === "string"))) {
						return getErrorResponse("categories and deleted_ids are required.");
					}
					if (!isRosterKind(body?.kind)) {
						return getErrorResponse("kind must be dancer or prop.");
					}
					const kind = body.kind;
					if (categories.length > ROSTER_MAX_CATEGORIES) {
						return getErrorResponse(`A roster can have at most ${ROSTER_MAX_CATEGORIES} categories.`);
					}

					const items = (categories as { id?: string, name: string }[]).map(c => ({ id: c.id, name: c.name.trim(), key: toNameKey(c.name) }));
					if (items.some(c => c.key === "" || c.name.length > ROSTER_CATEGORY_LENGTH)) {
						return getErrorResponse(`Category names must be 1–${ROSTER_CATEGORY_LENGTH} characters.`);
					}
					if (new Set(items.map(c => c.key)).size !== items.length) {
						return getErrorResponse("Category names must be unique.");
					}

					const keptIds = items.flatMap(c => c.id ? [c.id] : []);
					const deleted = new Set(deletedIds);
					if (new Set(keptIds).size !== keptIds.length || keptIds.some(id => deleted.has(id))) {
						return getErrorResponse("Each category can only appear once.");
					}

					// Only this kind's categories: a save on one tab can't touch the other's.
					const liveCategoryIds = await getLiveCategoryIds(kind);
					if ([...keptIds, ...deleted].some(id => !liveCategoryIds.has(id))) {
						return getErrorResponse("Category not found.", 404);
					}

					const deletedJson = JSON.stringify([...deleted]);
					const keptJson = JSON.stringify(keptIds);
					const updates = items.flatMap((c, i) => c.id ? [[c.id, c.name, c.key, i]] : []);
					const inserts = items.flatMap((c, i) => c.id ? [] : [[crypto.randomUUID(), rosterTeamId, kind, c.name, c.key, i]]);

					// At most five statements however many categories there are.
					const statements = [
						// Deletions first, so a deleted category's name can be reused in the same save.
						...(deleted.size === 0 ? [] : [
							env.DB.prepare(`
								UPDATE roster_categories SET deleted = 1, updated_at = datetime('now')
								WHERE id IN ${IDS_IN_JSON}
							`).bind(deletedJson),
							env.DB.prepare(`DELETE FROM roster_name_categories WHERE category_id IN ${IDS_IN_JSON}`).bind(deletedJson),
						]),
						...(updates.length === 0 ? [] : [
							// Park every kept category on a unique placeholder key first, so swapping two names
							// (正規 ↔ スポット) doesn't hit the unique index halfway through.
							env.DB.prepare(`UPDATE roster_categories SET name_key = id WHERE id IN ${IDS_IN_JSON}`).bind(keptJson),
							env.DB.prepare(`
								UPDATE roster_categories
								SET name = json_extract(j.value, '$[1]'), name_key = json_extract(j.value, '$[2]'),
									sort_order = json_extract(j.value, '$[3]'), updated_at = datetime('now')
								FROM json_each(?) AS j
								WHERE roster_categories.id = json_extract(j.value, '$[0]')
							`).bind(JSON.stringify(updates)),
						]),
						...prepareInsertRows(env.DB, "INSERT INTO roster_categories (id, team_id, kind, name, name_key, sort_order)", inserts),
					];
					// D1 rejects an empty batch, e.g. saving a team's empty list unchanged.
					if (statements.length > 0) {
						await env.DB.batch(statements);
					}

					return getSuccessResponse(await getRoster(env.DB, rosterTeamId));
				}
			} catch (e) {
				// Another editor saved the same name between our check and our write.
				if (isUniqueConstraintError(e)) {
					return getErrorResponse("Already in the roster.", 409);
				}
				return getErrorResponse(`Internal server error: ${(e as Error).message}`, 500);
			}

			return getErrorResponse(`Endpoint not found`, 404);
		}

		if (url.pathname.startsWith("/api/team/")) {
			// users change their own name
			if (url.pathname === "/api/team/members/name" && request.method === "POST") {
				const body = await request.json() as { name: string };
	
				await env.DB.prepare(`
					UPDATE users SET name = ?, updated_at = datetime('now')
					WHERE id = ?
				`).bind(body.name, session.user_id).run();
	
				return getSuccessResponse();
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

				const isNewUser = !user || user.password_hash === '';

				if (isNewUser) {
					const rawToken = crypto.randomUUID();
					const tokenHash = await hashPassword(rawToken);

					await env.DB.prepare(`
						INSERT INTO invite_tokens (id, user_id, team_id, token_hash, created_at)
						VALUES (?, ?, ?, ?, datetime('now'))
					`).bind(crypto.randomUUID(), user!.id, session.team_id, tokenHash).run();

					const inviteUrl = `https://tairetsu.app/${team.slug}?setup=${rawToken}`;

					try {
						await sendEmail(body.email, `${team.name}に招待されました`, `
							<p>${team.name}に招待されました。</p>
							<p>以下のリンクからアカウントを設定してください。</p>
							<p><a href="${inviteUrl}">${inviteUrl}</a></p>
							<p>※このメールは自動送信されています。返信には対応しておりませんのでご了承ください。</p>
						`);
					} catch (e: any) {
						return getErrorResponse(`Failed to send email: ${(e as Error)?.message}`, 500);
					}
				} else {
					try {
						await sendEmail(body.email, `${team.name}に招待されました`, `
							<p>${team.name}に追加されました。</p>
							<p><a href="https://tairetsu.app/${team.slug}">tairetsu.app/${team.slug}</a> からログインしてください。</p>
							<p>※このメールは自動送信されています。返信には対応しておりませんのでご了承ください。</p>
						`);
					} catch (e: any) {
						return getErrorResponse(`Failed to send email: ${(e as Error)?.message}`, 500);
					}
				}
	
				return getSuccessResponse({ success: true }, 201);
			}
	
			if (url.pathname === "/api/team/members" && request.method === "GET") {
				const { results } = await env.DB.prepare(`
					SELECT tm.id, u.name, tm.role, u.email
					FROM team_members tm
					JOIN users u ON tm.user_id = u.id
					WHERE tm.team_id = ? AND tm.deleted = 0
				`).bind(session.team_id).all();

				return getSuccessResponse(results);
			}
	
			if (url.pathname === "/api/team/members/role" && request.method === "POST") {
				const body = await request.json() as { member_id: string; role: string };
	
				await env.DB.prepare(`
					UPDATE team_members SET role = ?, updated_at = datetime('now')
					WHERE id = ? AND team_id = ?
				`).bind(body.role, body.member_id, session.team_id).run();
				return getSuccessResponse();
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
	
				return getSuccessResponse();
			}
		}

		if (url.pathname === "/api/choreos/get-password" && request.method === "POST") {
			try {
				const data = await request.json() as any;
				// The session's team, not the body's: the session is only checked against the query's team_id.
				const password = await env.DB.prepare(`
					SELECT c.password
					FROM choreos c
					WHERE c.id = ? AND c.team_id = ?
				`).bind(data.choreo_id as string, session.team_id).first<{password: string | null}>();
				return getSuccessResponse(password);
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
					u.name
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
			}));

			return getSuccessResponse(history);
		}

		if (request.method === "POST" && url.pathname === "/api/choreos/file") {
			if (session.role === "viewer") {
				return getErrorResponse("Not permitted to publish.", 403);
			}

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

				// Choreo IDs and file names aren't per team, so check an existing choreo is this team's before writing anything.
				const owner = await env.DB.prepare(
					"SELECT team_id FROM choreos WHERE id = ?"
				).bind(choreoId).first<{ team_id: string | null }>();
				if (owner && owner.team_id !== session.team_id) {
					return getErrorResponse("Choreo not found", 404);
				}

				// get next version number
				let version = 1;
				if (!isNew) {
					const current = await env.DB.prepare(
						"SELECT version FROM choreo_files WHERE choreo_id = ? AND is_current = 1"
					).bind(choreoId).first<{ version: number }>();

					if (!current) {
						console.log(`choreo not found: ${choreoId}`);
						return getErrorResponse("Choreo not found", 400);
					}

					version = current.version + 1;

					// mark old version as not current
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
				await env.DB.prepare(
					`INSERT INTO choreos (id, name, event_name, event_start_date, event_end_date, team_id, password)
					VALUES (?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(id) DO UPDATE SET
						name = excluded.name,
						event_name = excluded.event_name,
						event_start_date = excluded.event_start_date,
						event_end_date = excluded.event_end_date,
						password = excluded.password
					WHERE choreos.team_id = excluded.team_id`
				).bind(choreoId, name, eventName, eventStartDate, eventEndDate, session.team_id, password ?? null).run()
				.catch(e => { throw new Error(`Failed to upsert choreo info into db: ${e}`) });

				// insert new choreo_file row
				const fileId = crypto.randomUUID();
				await env.DB.prepare(
					`INSERT INTO choreo_files (id, choreo_id, version, is_current, stage_width, stage_length, dancer_count, prop_count, uploaded_by, uploaded_at)
					VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`
				).bind(fileId, choreoId, version, stageWidth, stageLength, dancerCount, propCount, uploadedBy, new Date().toISOString()).run()
				.catch(e => { throw new Error(`Failed to insert choreo file info into db: ${e}`) });

				return getSuccessResponse({ newFile: file }, isNew ? 201 : 200);
			} catch (e) {
				return getErrorResponse(`Internal server error: ${(e as Error).message}`, 500);
			}
		}

		return getErrorResponse(`Endpoint not found`, 404);
  }
};
