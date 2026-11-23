import { SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { editorHeaders, seedTwoTeams, sessionHeaders, viewerHeaders } from "./seed";
import { RosterSong, RosterSongsResponse } from "../src/models/models";

beforeAll(seedTwoTeams);

const call = (path: string, body?: unknown, headers: Record<string, string> = editorHeaders) =>
	SELF.fetch(`https://example.com/api/roster/songs${path}?team_id=team_a`, body === undefined
		? { headers }
		: { method: "POST", headers, body: JSON.stringify(body) });

const ok = async <T = RosterSongsResponse>(response: Response) => {
	expect(response.status).toBe(200);
	return await response.json() as T & RosterSongsResponse;
};

const songNamed = (songs: RosterSong[], name: string) => songs.find(s => s.name === name)!;

const addSong = async (name: string) => songNamed((await ok(await call("/add", { name }))).songs, name);

describe("access", () => {
	it("is closed to viewers", async () => {
		const responses = await Promise.all([
			call("", undefined, viewerHeaders),
			call("/add", { name: "曲" }, viewerHeaders),
			call("/actions/save", { section_id: "x", name: "a", counts: ["1"] }, viewerHeaders),
		]);
		expect(responses.map(r => r.status)).toEqual([403, 403, 403]);
	});

	it("is open to editors and admins", async () => {
		for (const headers of [editorHeaders, sessionHeaders]) {
			expect((await call("", undefined, headers)).status).toBe(200);
		}
	});
});

describe("songs", () => {
	it("adds, renames and removes a song, with names unique per team", async () => {
		const song = await addSong("演舞");
		expect(song.sections).toEqual([]);
		expect((await call("/add", { name: " 演舞 " })).status).toBe(409);
		expect((await call("/add", { name: "あいうえおかきくけこさしすせそた" })).status).toBe(400);

		const renamed = await ok(await call("/update", { id: song.id, name: "演舞2026" }));
		expect(songNamed(renamed.songs, "演舞2026").id).toBe(song.id);

		const removed = await ok(await call("/remove", { id: song.id }));
		expect(removed.songs.find(s => s.id === song.id)).toBeUndefined();
		// The name is free again once removed.
		await addSong("演舞2026");
	});
});

describe("sections", () => {
	it("adds a paste in order, skipping repeats and long names", async () => {
		const song = await addSong("総踊り");
		const result = await ok<{ added: number, skipped: { name: string, reason: string }[] }>(
			await call("/sections/add", { song_id: song.id, names: ["OP", "Aメロ", "", "ＯＰ", "あいうえおかきくけこさしすせそた", "サビ"] }));
		expect(songNamed(result.songs, "総踊り").sections.map(s => s.name)).toEqual(["OP", "Aメロ", "サビ"]);
		expect(result.added).toBe(3);
		expect(result.skipped.map(s => s.reason)).toEqual(["exists", "too_long"]);

		const more = await ok(await call("/sections/add", { song_id: song.id, names: ["ラスト"] }));
		expect(songNamed(more.songs, "総踊り").sections.map(s => s.name)).toEqual(["OP", "Aメロ", "サビ", "ラスト"]);
	});

	it("renames, reorders and removes sections", async () => {
		const song = await addSong("曲A");
		const added = await ok(await call("/sections/add", { song_id: song.id, names: ["1", "2", "3"] }));
		const [one, two, three] = songNamed(added.songs, "曲A").sections;

		expect((await call("/sections/update", { id: one.id, name: "2" })).status).toBe(409);
		await ok(await call("/sections/update", { id: one.id, name: "イントロ" }));

		const reordered = await ok(await call("/sections/reorder", { song_id: song.id, ids: [three.id, one.id, two.id] }));
		expect(songNamed(reordered.songs, "曲A").sections.map(s => s.name)).toEqual(["3", "イントロ", "2"]);
		expect((await call("/sections/reorder", { song_id: song.id, ids: [three.id, one.id] })).status).toBe(400);

		await ok(await call("/actions/save", { section_id: two.id, name: "手上げ", counts: ["1"] }));
		const removed = await ok(await call("/sections/remove", { id: two.id }));
		expect(songNamed(removed.songs, "曲A").sections.map(s => s.name)).toEqual(["3", "イントロ"]);
	});
});

describe("振り", () => {
	const sectionOf = async (songName: string) => {
		const song = await addSong(songName);
		const result = await ok(await call("/sections/add", { song_id: song.id, names: ["サビ"] }));
		return songNamed(result.songs, songName).sections[0];
	};

	it("adds and edits a 振り with its counts", async () => {
		const section = await sectionOf("曲B");
		const added = await ok<{ id: string }>(await call("/actions/save", { section_id: section.id, name: "回転", counts: ["1", "3", "5", "7"] }));
		expect(songNamed(added.songs, "曲B").sections[0].actions).toEqual([{ id: added.id, name: "回転", counts: ["1", "3", "5", "7"] }]);

		const edited = await ok(await call("/actions/save", { section_id: section.id, id: added.id, name: "ターン", counts: ["2"] }));
		expect(songNamed(edited.songs, "曲B").sections[0].actions).toEqual([{ id: added.id, name: "ターン", counts: ["2"] }]);
	});

	it("checks names, counts and the 5-振り limit", async () => {
		const section = await sectionOf("曲C");
		const save = (name: string, counts: string[]) => call("/actions/save", { section_id: section.id, name, counts });
		expect((await save("a", [])).status).toBe(400);
		expect((await save("a", ["1", "１"])).status).toBe(400);
		expect((await save("a", ["123456"])).status).toBe(400);
		expect((await save("a", Array.from({ length: 17 }, (_, i) => `${i}`))).status).toBe(400);
		expect((await save("あいうえおかきくけこさ", ["1"])).status).toBe(400);

		expect((await save("a", ["1"])).status).toBe(200);
		expect((await save("ａ", ["2"])).status).toBe(409);
		for (const name of ["b", "c", "d", "e"]) {
			expect((await save(name, ["1"])).status).toBe(200);
		}
		expect((await save("f", ["1"])).status).toBe(400);
	});

	it("reorders and removes 振り", async () => {
		const section = await sectionOf("曲D");
		const a = await ok<{ id: string }>(await call("/actions/save", { section_id: section.id, name: "a", counts: ["1"] }));
		const b = await ok<{ id: string }>(await call("/actions/save", { section_id: section.id, name: "b", counts: ["1"] }));
		const reordered = await ok(await call("/actions/reorder", { section_id: section.id, ids: [b.id, a.id] }));
		expect(songNamed(reordered.songs, "曲D").sections[0].actions.map(x => x.name)).toEqual(["b", "a"]);
		const removed = await ok(await call("/actions/remove", { id: b.id }));
		expect(songNamed(removed.songs, "曲D").sections[0].actions.map(x => x.name)).toEqual(["a"]);
	});

	it("can't touch another team's songs", async () => {
		const section = await sectionOf("曲E");
		const other = (path: string, body: unknown) => SELF.fetch(`https://example.com/api/roster/songs${path}`, {
			method: "POST", headers: { "Content-Type": "application/json", Cookie: "token=nobody" }, body: JSON.stringify(body),
		});
		expect((await other("/actions/save", { section_id: section.id, name: "a", counts: ["1"] })).status).toBe(401);
		expect((await call("/actions/save", { section_id: "missing", name: "a", counts: ["1"] })).status).toBe(404);
	});
});
