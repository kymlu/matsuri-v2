import { SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { editorHeaders, seedTwoTeams, sessionHeaders, viewerHeaders } from "./seed";

beforeAll(seedTwoTeams);

const getPassword = (choreoId: string, bodyTeamId: string, headers: Record<string, string> = sessionHeaders) =>
	SELF.fetch("https://example.com/api/choreos/get-password?team_id=team_a", {
		method: "POST",
		headers,
		body: JSON.stringify({ choreo_id: choreoId, team_id: bodyTeamId }),
	});

describe("/api/choreos/get-password", () => {
	it("returns the password of a choreo in the session's team", async () => {
		const response = await getPassword("choreo_a", "team_a");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ password: "pass-a" });
	});

	it("doesn't return another team's password when the body names that team", async () => {
		const response = await getPassword("choreo_b", "team_b");
		expect(await response.json()).toBeNull();
	});

	it("returns the password to editors", async () => {
		const response = await getPassword("choreo_a", "team_a", editorHeaders);
		expect(await response.json()).toEqual({ password: "pass-a" });
	});

	it("refuses viewers, who can't publish", async () => {
		const response = await getPassword("choreo_a", "team_a", viewerHeaders);
		expect(response.status).toBe(403);
		expect(JSON.stringify(await response.json())).not.toContain("pass-a");
	});
});
