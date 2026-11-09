import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { seedTwoTeams, sessionHeaders } from "./seed";

beforeAll(seedTwoTeams);

const publish = (choreoId: string, isNew: boolean) =>
	SELF.fetch("https://example.com/api/choreos/file?team_id=team_a", {
		method: "POST",
		headers: sessionHeaders,
		body: JSON.stringify({
			file: { name: "Taken" },
			choreo_id: choreoId,
			is_new: isNew,
			name: "Taken",
			event_name: null,
			event_start_date: null,
			event_end_date: null,
			password: null,
			stage_width: 10,
			stage_length: 8,
			dancer_count: 1,
			prop_count: 0,
		}),
	});

describe("POST /api/choreos/file", () => {
	it("publishes a new version of the team's own choreo", async () => {
		const response = await publish("choreo_a", false);
		expect(response.status).toBe(200);
		expect(await env.BUCKET.head("choreo_a_v2.json")).not.toBeNull();
	});

	it.each([false, true])("leaves another team's choreo untouched (is_new: %s)", async isNew => {
		const response = await publish("choreo_b", isNew);
		expect(response.status).toBe(404);

		const choreo = await env.DB.prepare("SELECT name, password, team_id FROM choreos WHERE id = 'choreo_b'").first();
		expect(choreo).toEqual({ name: "B", password: "pass-b", team_id: "team_b" });
		const files = await env.DB.prepare("SELECT version, is_current FROM choreo_files WHERE choreo_id = 'choreo_b'").all();
		expect(files.results).toEqual([{ version: 1, is_current: 1 }]);
		expect(await (await env.BUCKET.get("choreo_b_v1.json"))!.json()).toEqual({ name: "B" });
		expect(await env.BUCKET.head("choreo_b_v2.json")).toBeNull();
	});
});
