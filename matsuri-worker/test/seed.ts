import { env } from "cloudflare:test";
import schema from "../schema.sql?raw";

// Team A has a logged-in admin (cookie "token=token_a"), editor ("token_editor") and viewer ("token_viewer").
// Each team has a password-protected choreo at v1. Team B has one roster category and name.
export async function seedTwoTeams() {
	const statements = schema
		.replace(/--.*$/gm, "")
		.split(";")
		.map(s => s.trim())
		.filter(Boolean);
	await env.DB.batch(statements.map(s => env.DB.prepare(s)));
	await env.DB.batch([
		env.DB.prepare("INSERT INTO teams (id, name, slug) VALUES ('team_a', 'A', 'a'), ('team_b', 'B', 'b')"),
		env.DB.prepare(`INSERT INTO users (id, email, password_hash, name)
			VALUES ('user_a', 'a@example.com', 'x', 'A'), ('user_editor', 'e@example.com', 'x', 'E'), ('user_viewer', 'v@example.com', 'x', 'V')`),
		env.DB.prepare(`INSERT INTO team_members (id, team_id, user_id, role)
			VALUES ('member_a', 'team_a', 'user_a', 'admin'), ('member_editor', 'team_a', 'user_editor', 'editor'), ('member_viewer', 'team_a', 'user_viewer', 'viewer')`),
		env.DB.prepare(`INSERT INTO sessions (id, user_id, team_id, token, expires_at)
			VALUES ('s1', 'user_a', 'team_a', 'token_a', datetime('now', '+1 day')),
			('s2', 'user_editor', 'team_a', 'token_editor', datetime('now', '+1 day')),
			('s3', 'user_viewer', 'team_a', 'token_viewer', datetime('now', '+1 day'))`),
		env.DB.prepare("INSERT INTO roster_categories (id, team_id, name, name_key, sort_order) VALUES ('cat_b', 'team_b', 'B', 'B', 0)"),
		env.DB.prepare("INSERT INTO roster_names (id, team_id, name, name_key) VALUES ('name_b', 'team_b', 'B', 'B')"),
		env.DB.prepare("INSERT INTO choreos (id, name, team_id, password) VALUES ('choreo_a', 'A', 'team_a', 'pass-a'), ('choreo_b', 'B', 'team_b', 'pass-b')"),
		env.DB.prepare(`INSERT INTO choreo_files (id, choreo_id, version, is_current, stage_width, stage_length, dancer_count, prop_count)
			VALUES ('file_a', 'choreo_a', 1, 1, 10, 8, 1, 0), ('file_b', 'choreo_b', 1, 1, 10, 8, 1, 0)`),
	]);
	await env.BUCKET.put("choreo_a_v1.json", JSON.stringify({ name: "A" }));
	await env.BUCKET.put("choreo_b_v1.json", JSON.stringify({ name: "B" }));
}

export const sessionHeaders = { "Content-Type": "application/json", Cookie: "token=token_a" };
export const editorHeaders = { "Content-Type": "application/json", Cookie: "token=token_editor" };
export const viewerHeaders = { "Content-Type": "application/json", Cookie: "token=token_viewer" };
