import { SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { seedTwoTeams, sessionHeaders } from "./seed";

beforeAll(seedTwoTeams);

const getPassword = (choreoId: string, bodyTeamId: string) =>
	SELF.fetch("https://example.com/api/choreos/get-password?team_id=team_a", {
		method: "POST",
		headers: sessionHeaders,
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
});
