import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { editorHeaders, seedTwoTeams, sessionHeaders, viewerHeaders } from "./seed";
import { RosterKind, RosterList, RosterResponse } from "../src/models/models";

beforeAll(seedTwoTeams);

const call = (path: string, body?: unknown, headers: Record<string, string> = editorHeaders) =>
	SELF.fetch(`https://example.com/api/roster${path}?team_id=team_a`, body === undefined
		? { headers }
		: { method: "POST", headers, body: JSON.stringify(body) });

const listOf = (roster: RosterResponse, kind: RosterKind) => kind === "dancer" ? roster.dancers : roster.props;

// The helpers return one kind's list; most tests are about dancers.
const getFullRoster = async () => await (await call("")).json() as RosterResponse;
const getRoster = async (kind: RosterKind = "dancer") => listOf(await getFullRoster(), kind);

const saveCategories = async (categories: { id?: string, name: string }[], deletedIds: string[] = [], kind: RosterKind = "dancer") => {
	const response = await call("/categories/save", { kind, categories, deleted_ids: deletedIds });
	expect(response.status).toBe(200);
	return listOf(await response.json() as RosterResponse, kind);
};

type AddResult = { roster: RosterList, added: number, updated: number, skipped: { name: string, reason: string }[] };
const addNames = async (names: string[], categoryIds: string[] = [], kind: RosterKind = "dancer") => {
	const response = await call("/names/add", { kind, names, category_ids: categoryIds });
	expect(response.status).toBe(200);
	const result = await response.json() as Omit<AddResult, "roster"> & { roster: RosterResponse };
	return { ...result, roster: listOf(result.roster, kind) } as AddResult;
};

const categoryNames = (roster: RosterList, name: string) => {
	const byId = new Map(roster.categories.map(c => [c.id, c.name]));
	return roster.names.find(n => n.name === name)?.categoryIds.map(id => byId.get(id));
};

describe("access", () => {
	it("needs a session", async () => {
		const response = await SELF.fetch("https://example.com/api/roster?team_id=team_a");
		expect(response.status).toBe(401);
	});

	it("is closed to viewers on every route", async () => {
		const responses = await Promise.all([
			call("", undefined, viewerHeaders),
			call("/names/add", { names: ["a"], category_ids: [] }, viewerHeaders),
			call("/names/update", { id: "x", name: "a", category_ids: [] }, viewerHeaders),
			call("/names/remove", { id: "x" }, viewerHeaders),
			call("/categories/save", { categories: [], deleted_ids: [] }, viewerHeaders),
		]);
		expect(responses.map(r => r.status)).toEqual([403, 403, 403, 403, 403]);
	});

	it("is open to editors and admins, and shows only the session's team", async () => {
		for (const headers of [editorHeaders, sessionHeaders]) {
			const response = await call("", undefined, headers);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ dancers: { categories: [], names: [] }, props: { categories: [], names: [] } });
		}
	});

	it("returns 404 for unknown roster paths, including a trailing slash", async () => {
		expect((await call("/")).status).toBe(404);
		expect((await call("/names")).status).toBe(404);
	});

	it("starts each test from the seed", async () => {
		// The previous tests only read; this one checks writes don't leak between tests.
		await addNames(["さくら"]);
		expect((await getRoster()).names).toHaveLength(1);
	});

	it("doesn't see the previous test's writes", async () => {
		expect((await getRoster()).names).toHaveLength(0);
	});
});

describe("POST /api/roster/names/add", () => {
	it("adds new names with their categories, in category order", async () => {
		const { categories } = await saveCategories([{ name: "正規" }, { name: "旗士" }]);
		const result = await addNames(["はると", "さくら"], [categories[1].id, categories[0].id]);
		expect(result).toMatchObject({ added: 2, updated: 0, skipped: [] });
		expect(categoryNames(result.roster, "はると")).toEqual(["正規", "旗士"]);
		const row = await env.DB.prepare("SELECT created_by FROM roster_names WHERE name = 'はると'").first();
		expect(row).toEqual({ created_by: "member_editor" });
	});

	it("adds categories to names already in the roster instead of duplicating them", async () => {
		const { categories } = await saveCategories([{ name: "正規" }, { name: "旗士" }]);
		await addNames(["さくら"], [categories[0].id]);
		const result = await addNames(["さくら", "そうた"], [categories[1].id]);
		expect(result).toMatchObject({ added: 1, updated: 1, skipped: [] });
		expect(result.roster.names).toHaveLength(2);
		expect(categoryNames(result.roster, "さくら")).toEqual(["正規", "旗士"]);
	});

	it("skips existing names that would not change", async () => {
		const { categories } = await saveCategories([{ name: "正規" }]);
		await addNames(["さくら"], [categories[0].id]);
		expect(await addNames(["さくら"])).toMatchObject({ added: 0, updated: 0, skipped: [{ name: "さくら", reason: "exists" }] });
		expect(await addNames(["さくら"], [categories[0].id])).toMatchObject({ updated: 0, skipped: [{ name: "さくら", reason: "exists" }] });
	});

	it("skips names over 15 characters and adds the rest", async () => {
		const result = await addNames(["そうた", "たかはしゆうたろうのおとうとくん"]);
		expect(result).toMatchObject({ added: 1, skipped: [{ name: "たかはしゆうたろうのおとうとくん", reason: "too_long" }] });
	});

	it("ignores blank lines, repeats and width or spacing differences", async () => {
		const result = await addNames(["Ａ", "", "  ", "A ", "A　", "さくら\nさくら"]);
		expect(new Set(result.roster.names.map(n => n.name))).toEqual(new Set(["Ａ", "さくら"]));
		expect(result.added).toBe(2);
	});

	it("handles a 200-name paste with two categories", async () => {
		const { categories } = await saveCategories([{ name: "正規" }, { name: "旗士" }]);
		const names = Array.from({ length: 200 }, (_, i) => `ダンサー${i}`);
		const result = await addNames(names, categories.map(c => c.id));
		expect(result.added).toBe(200);
		expect(result.roster.names.every(n => n.categoryIds.length === 2)).toBe(true);
	});

	it("keeps quotes and backslashes intact through the JSON insert", async () => {
		const result = await addNames([`O'Neil`, `"あ"`, `a\\b`]);
		expect(new Set(result.roster.names.map(n => n.name))).toEqual(new Set([`O'Neil`, `"あ"`, `a\\b`]));
	});

	it("rejects more than 200 distinct names", async () => {
		const response = await call("/names/add", { kind: "dancer", names: Array.from({ length: 201 }, (_, i) => `n${i}`), category_ids: [] });
		expect(response.status).toBe(400);
	});

	it("doesn't count blank lines or repeats toward the 200 limit", async () => {
		const names = Array.from({ length: 200 }, (_, i) => `n${i}`);
		// 200 names, each followed by blank lines, then all 200 again.
		const pasted = [...names.flatMap(n => [n, "", "  "]), ...names].join("\n");
		const result = await addNames([pasted]);
		expect(result.added).toBe(200);
		expect(result.skipped).toEqual([]);
	});

	it("rejects going over 1000 names", async () => {
		await env.DB.prepare(`
			WITH RECURSIVE n(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM n WHERE i < 999)
			INSERT INTO roster_names (id, team_id, name, name_key) SELECT 'n' || i, 'team_a', 'n' || i, 'n' || i FROM n
		`).run();
		const response = await call("/names/add", { kind: "dancer", names: ["one more"], category_ids: [] });
		expect(response.status).toBe(400);
	});

	it("rejects another team's category", async () => {
		const response = await call("/names/add", { kind: "dancer", names: ["さくら"], category_ids: ["cat_b"] });
		expect(response.status).toBe(400);
	});

	it("rejects a malformed body", async () => {
		expect((await call("/names/add", { kind: "dancer", names: "さくら", category_ids: [] })).status).toBe(400);
		expect((await call("/names/add", { names: ["さくら"], category_ids: [] })).status).toBe(400);
		expect((await call("/names/add", { kind: "obstacle", names: ["さくら"], category_ids: [] })).status).toBe(400);
		const response = await SELF.fetch("https://example.com/api/roster/names/add?team_id=team_a", {
			method: "POST", headers: editorHeaders, body: "not json",
		});
		expect(response.status).toBe(400);
	});
});

describe("POST /api/roster/names/update", () => {
	it("renames and replaces the whole set of categories", async () => {
		const { categories } = await saveCategories([{ name: "正規" }, { name: "スポット" }]);
		const { roster } = await addNames(["はな"], [categories[0].id]);
		const response = await call("/names/update", { id: roster.names[0].id, name: " はなこ ", category_ids: [categories[1].id] });
		expect(response.status).toBe(200);
		const updated = (await response.json() as RosterResponse).dancers;
		expect(updated.names).toEqual([{ id: roster.names[0].id, name: "はなこ", categoryIds: [categories[1].id] }]);
	});

	it("rejects a name already used by another row", async () => {
		const { roster } = await addNames(["さくら", "あおい"]);
		const aoi = roster.names.find(n => n.name === "あおい")!;
		expect((await call("/names/update", { id: aoi.id, name: "さくら", category_ids: [] })).status).toBe(409);
	});

	it("allows changing the width of the same name", async () => {
		const { roster } = await addNames(["Ａ"]);
		expect((await call("/names/update", { id: roster.names[0].id, name: "A", category_ids: [] })).status).toBe(200);
	});

	it("rejects blank and too-long names", async () => {
		const { roster } = await addNames(["さくら"]);
		const id = roster.names[0].id;
		expect((await call("/names/update", { id, name: " ", category_ids: [] })).status).toBe(400);
		expect((await call("/names/update", { id, name: "たかはしゆうたろうのおとうとくん", category_ids: [] })).status).toBe(400);
	});

	it("can't touch another team's name", async () => {
		expect((await call("/names/update", { id: "name_b", name: "x", category_ids: [] })).status).toBe(404);
	});

	it("rejects another team's category", async () => {
		const { roster } = await addNames(["さくら"]);
		expect((await call("/names/update", { id: roster.names[0].id, name: "さくら", category_ids: ["cat_b"] })).status).toBe(400);
	});
});

describe("POST /api/roster/names/remove", () => {
	it("removes a name, which can then be added again", async () => {
		const { roster } = await addNames(["みお"]);
		const response = await call("/names/remove", { id: roster.names[0].id });
		expect(response.status).toBe(200);
		expect((await response.json() as RosterResponse).dancers.names).toEqual([]);

		const readded = await addNames(["みお"]);
		expect(readded.added).toBe(1);
		expect(readded.roster.names[0].id).not.toBe(roster.names[0].id);
	});

	it("can't remove another team's name, or the same name twice", async () => {
		expect((await call("/names/remove", { id: "name_b" })).status).toBe(404);
		const { roster } = await addNames(["みお"]);
		await call("/names/remove", { id: roster.names[0].id });
		expect((await call("/names/remove", { id: roster.names[0].id })).status).toBe(404);
	});
});

describe("POST /api/roster/categories/save", () => {
	it("saves in list order, renames and adds", async () => {
		const first = await saveCategories([{ name: "正規" }, { name: "スポット" }]);
		const [seiki, spot] = first.categories;
		const second = await saveCategories([{ id: spot.id, name: "スポット" }, { id: seiki.id, name: "正規メンバー" }, { name: "旗士" }]);
		expect(second.categories.map(c => c.name)).toEqual(["スポット", "正規メンバー", "旗士"]);
		expect(second.categories[0].id).toBe(spot.id);
	});

	it("deleting a category removes it from names but keeps the names", async () => {
		const { categories } = await saveCategories([{ name: "正規" }, { name: "旗士" }]);
		await addNames(["はると"], categories.map(c => c.id));
		const roster = await saveCategories([{ id: categories[0].id, name: "正規" }], [categories[1].id]);
		expect(roster.categories.map(c => c.name)).toEqual(["正規"]);
		expect(categoryNames(roster, "はると")).toEqual(["正規"]);
	});

	it("swaps two names in one save", async () => {
		const { categories: [a, b] } = await saveCategories([{ name: "正規" }, { name: "スポット" }]);
		const roster = await saveCategories([{ id: a.id, name: "スポット" }, { id: b.id, name: "正規" }]);
		expect(roster.categories).toEqual([{ id: a.id, name: "スポット" }, { id: b.id, name: "正規" }]);
	});

	it("reuses a deleted category's name in the same save", async () => {
		const { categories: [seiki, ippan] } = await saveCategories([{ name: "正規" }, { name: "一般" }]);
		const roster = await saveCategories([{ id: seiki.id, name: "一般" }], [ippan.id]);
		expect(roster.categories).toEqual([{ id: seiki.id, name: "一般" }]);
	});

	it("renames, reorders and deletes many categories in one save", async () => {
		const first = await saveCategories(Array.from({ length: 60 }, (_, i) => ({ name: `c${i}` })));
		const kept = first.categories.slice(0, 40).reverse();
		const roster = await saveCategories(
			[...kept.map(c => ({ id: c.id, name: `r${c.name}` })), { name: "new" }],
			first.categories.slice(40).map(c => c.id),
		);
		expect(roster.categories.map(c => c.name)).toEqual([...kept.map(c => `r${c.name}`), "new"]);
		expect(roster.categories.slice(0, 40).map(c => c.id)).toEqual(kept.map(c => c.id));
	});

	it("saves an empty list unchanged", async () => {
		expect(await saveCategories([])).toEqual({ categories: [], names: [] });
	});

	it("keeps quotes and backslashes intact when renaming", async () => {
		const { categories: [a] } = await saveCategories([{ name: "a" }]);
		const roster = await saveCategories([{ id: a.id, name: `O'"\\` }, { name: `"new"` }]);
		expect(roster.categories.map(c => c.name)).toEqual([`O'"\\`, `"new"`]);
	});

	it("rejects more than 100 categories", async () => {
		const response = await call("/categories/save", { kind: "dancer", categories: Array.from({ length: 101 }, (_, i) => ({ name: `c${i}` })), deleted_ids: [] });
		expect(response.status).toBe(400);
	});

	it("rejects duplicates, blanks and long names", async () => {
		const save = (categories: { id?: string, name: string }[], deletedIds: string[] = []) =>
			call("/categories/save", { kind: "dancer", categories, deleted_ids: deletedIds });
		expect((await save([{ name: "正規" }, { name: "正規 " }])).status).toBe(400);
		expect((await save([{ name: " " }])).status).toBe(400);
		expect((await save([{ name: "とてもながいくぶんのなまえ" }])).status).toBe(400);
	});

	it("rejects an id that is both kept and deleted", async () => {
		const { categories } = await saveCategories([{ name: "正規" }]);
		const response = await call("/categories/save", { kind: "dancer", categories: [{ id: categories[0].id, name: "正規" }], deleted_ids: [categories[0].id] });
		expect(response.status).toBe(400);
	});

	it("can't touch another team's category", async () => {
		expect((await call("/categories/save", { kind: "dancer", categories: [{ id: "cat_b", name: "x" }], deleted_ids: [] })).status).toBe(404);
		expect((await call("/categories/save", { kind: "dancer", categories: [], deleted_ids: ["cat_b"] })).status).toBe(404);
	});
});

describe("concurrent writes", () => {
	it("turns a unique-index clash into 409", async () => {
		// Another editor added スポット while this editor's categories dialog was open,
		// and this editor saves a new スポット from the stale list.
		const { categories: [seiki] } = await saveCategories([{ name: "正規" }]);
		await saveCategories([{ id: seiki.id, name: "正規" }, { name: "スポット" }]);
		const response = await call("/categories/save", { kind: "dancer", categories: [{ id: seiki.id, name: "正規" }, { name: "スポット" }], deleted_ids: [] });
		expect(response.status).toBe(409);
		expect((await getRoster()).categories.map(c => c.name)).toEqual(["正規", "スポット"]);
	});
});

describe("kinds", () => {
	it("keeps dancers and props apart, so the same name can be in both", async () => {
		await addNames(["扇"], [], "dancer");
		await addNames(["扇", "大旗"], [], "prop");
		const roster = await getFullRoster();
		expect(roster.dancers.names.map(n => n.name)).toEqual(["扇"]);
		expect(new Set(roster.props.names.map(n => n.name))).toEqual(new Set(["扇", "大旗"]));
	});

	it("rejects a prop with a dancer category", async () => {
		const { categories: [seiki] } = await saveCategories([{ name: "正規" }], [], "dancer");
		const response = await call("/names/add", { kind: "prop", names: ["扇"], category_ids: [seiki.id] });
		expect(response.status).toBe(400);
	});

	it("saves one kind's categories without touching the other's", async () => {
		const { categories: [seiki] } = await saveCategories([{ name: "正規" }], [], "dancer");
		await saveCategories([{ name: "旗" }, { name: "正規" }], [], "prop");
		// Saving an empty prop list deletes the prop categories only.
		const { categories: propCategories } = await saveCategories([], (await getRoster("prop")).categories.map(c => c.id), "prop");
		expect(propCategories).toEqual([]);
		expect((await getRoster("dancer")).categories).toEqual([{ id: seiki.id, name: "正規" }]);
		// A dancer category can't be deleted from the prop tab.
		const response = await call("/categories/save", { kind: "prop", categories: [], deleted_ids: [seiki.id] });
		expect(response.status).toBe(404);
	});

	it("checks duplicate names within a kind only", async () => {
		await addNames(["扇"], [], "dancer");
		const { roster } = await addNames(["扇", "大旗"], [], "prop");
		const ogi = roster.names.find(n => n.name === "扇")!;
		const flag = roster.names.find(n => n.name === "大旗")!;
		expect((await call("/names/update", { id: flag.id, name: "扇", category_ids: [] })).status).toBe(409);
		expect((await call("/names/update", { id: ogi.id, name: "扇", category_ids: [] })).status).toBe(200);
	});

	it("requires a kind when saving categories", async () => {
		expect((await call("/categories/save", { categories: [], deleted_ids: [] })).status).toBe(400);
	});

	it("counts the 1000-name limit per kind", async () => {
		await env.DB.prepare(`
			WITH RECURSIVE n(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM n WHERE i < 999)
			INSERT INTO roster_names (id, team_id, name, name_key) SELECT 'n' || i, 'team_a', 'n' || i, 'n' || i FROM n
		`).run();
		expect((await call("/names/add", { kind: "dancer", names: ["one more"], category_ids: [] })).status).toBe(400);
		expect((await addNames(["大旗"], [], "prop")).added).toBe(1);
	});
});

describe("prop defaults", () => {
	const update = (id: string, extra: Record<string, unknown>) =>
		call("/names/update", { id, name: "大旗", category_ids: [], ...extra });

	it("sets, reads back and clears a prop's size and colour", async () => {
		const { roster } = await addNames(["大旗"], [], "prop");
		const id = roster.names[0].id;

		expect((await update(id, { length: 1, width: 4, color: "#F08A00" })).status).toBe(200);
		expect((await getRoster("prop")).names[0]).toEqual({ id, name: "大旗", categoryIds: [], length: 1, width: 4, color: "#F08A00" });

		// Leaving a default out keeps it; null clears it.
		expect((await update(id, { color: null })).status).toBe(200);
		expect((await getRoster("prop")).names[0]).toEqual({ id, name: "大旗", categoryIds: [], length: 1, width: 4 });
	});

	it("keeps a size of 0.5 and 20, and rejects anything outside that", async () => {
		const { roster } = await addNames(["大旗"], [], "prop");
		const id = roster.names[0].id;
		expect((await update(id, { length: 0.5, width: 20 })).status).toBe(200);
		expect((await update(id, { length: 0.4 })).status).toBe(400);
		expect((await update(id, { width: 20.5 })).status).toBe(400);
		expect((await update(id, { width: "4" })).status).toBe(400);
	});

	it("rejects a colour that isn't #RRGGBB", async () => {
		const { roster } = await addNames(["大旗"], [], "prop");
		const id = roster.names[0].id;
		expect((await update(id, { color: "orange" })).status).toBe(400);
		expect((await update(id, { color: "#F08A0" })).status).toBe(400);
	});

	it("rejects defaults on a dancer name", async () => {
		const { roster } = await addNames(["さくら"]);
		const response = await call("/names/update", { id: roster.names[0].id, name: "さくら", category_ids: [], color: "#F08A00" });
		expect(response.status).toBe(400);
		expect((await getRoster()).names[0]).toEqual({ id: roster.names[0].id, name: "さくら", categoryIds: [] });
	});
});