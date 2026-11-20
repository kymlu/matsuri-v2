import { SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { seedTwoTeams, sessionHeaders, viewerHeaders } from "./seed";

beforeAll(seedTwoTeams);

// Reads the body too: an unread R2 body breaks isolated storage between tests.
const getFile = async (choreoId: string, teamId: string, headers: Record<string, string> = {}) => {
	const response = await SELF.fetch(`https://example.com/api/choreos/file?team_id=${teamId}&choreo_id=${choreoId}&version=1`, { headers });
	return { status: response.status, body: await response.json() };
};

const verify = async (choreoId: string, teamId: string, password: string, ip = "1.1.1.1") => {
	const response = await SELF.fetch("https://example.com/api/choreos/verify", {
		method: "POST",
		headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
		body: JSON.stringify({ choreo_id: choreoId, team_id: teamId, password }),
	});
	return { status: response.status, body: await response.json() as { token?: string } };
};

const unlock = async (choreoId: string, teamId: string, password: string) =>
	(await verify(choreoId, teamId, password)).body.token!;

const publishWithPassword = async (password: string | null) => {
	const response = await SELF.fetch("https://example.com/api/choreos/file?team_id=team_a", {
		method: "POST",
		headers: sessionHeaders,
		body: JSON.stringify({
			file: { name: "A" },
			choreo_id: "choreo_a",
			is_new: false,
			name: "A",
			event_name: null,
			event_start_date: null,
			event_end_date: null,
			password,
			stage_width: 10,
			stage_length: 8,
			dancer_count: 1,
			prop_count: 0,
		}),
	});
	await response.text();
	return response;
};

describe("locked choreo files", () => {
	it("refuses a locked choreo without a token", async () => {
		const response = await getFile("choreo_a", "team_a");
		expect(response.status).toBe(403);
		expect(response.body).toMatchObject({ code: "locked" });
	});

	it("opens for the team's logged-in members, viewers included", async () => {
		expect((await getFile("choreo_a", "team_a", sessionHeaders)).status).toBe(200);
		expect((await getFile("choreo_a", "team_a", viewerHeaders)).status).toBe(200);
	});

	it("doesn't open another team's choreo with this team's login", async () => {
		expect((await getFile("choreo_b", "team_b", sessionHeaders)).status).toBe(403);
	});

	it("gives a token for the right password and opens with it", async () => {
		expect((await verify("choreo_a", "team_a", "wrong")).status).toBe(401);

		const token = await unlock("choreo_a", "team_a", "pass-a");
		expect(token).toMatch(/^[0-9a-f]{64}$/);
		expect((await getFile("choreo_a", "team_a", { "X-Choreo-Unlock": token })).status).toBe(200);
		expect((await getFile("choreo_a", "team_a", { "X-Choreo-Unlock": "not-a-token" })).status).toBe(403);
	});

	it("doesn't open a different choreo with the token", async () => {
		const token = await unlock("choreo_a", "team_a", "pass-a");
		expect((await getFile("choreo_b", "team_b", { "X-Choreo-Unlock": token })).status).toBe(403);
	});

	it("keeps tokens across versions with the same password, and drops them when it changes", async () => {
		const token = await unlock("choreo_a", "team_a", "pass-a");

		expect((await publishWithPassword("pass-a")).status).toBe(200);
		expect((await getFile("choreo_a", "team_a", { "X-Choreo-Unlock": token })).status).toBe(200);

		expect((await publishWithPassword("pass-new")).status).toBe(200);
		expect((await getFile("choreo_a", "team_a", { "X-Choreo-Unlock": token })).status).toBe(403);
		expect((await verify("choreo_a", "team_a", "pass-a")).status).toBe(401);
		const newToken = await unlock("choreo_a", "team_a", "pass-new");
		expect((await getFile("choreo_a", "team_a", { "X-Choreo-Unlock": newToken })).status).toBe(200);
	});

	it("opens without a token once the password is removed", async () => {
		expect((await publishWithPassword(null)).status).toBe(200);
		expect((await getFile("choreo_a", "team_a")).status).toBe(200);
		expect((await verify("choreo_a", "team_a", "")).status).toBe(200);
	});

	it("limits password tries per choreo and IP", async () => {
		let status = 0;
		for (let i = 0; i < 25 && status !== 429; i++) {
			status = (await verify("choreo_b", "team_b", "wrong", "2.2.2.2")).status;
		}
		expect(status).toBe(429);
		expect((await verify("choreo_b", "team_b", "wrong", "3.3.3.3")).status).toBe(401);
	});
});
