import { SHORT_NAME_LENGTH } from "../consts/consts";
import { RosterKind, RosterLink, RosterList, RosterName } from "../../models/roster";
import { strCompare } from "./globalHelper";

export const ROSTER_CATEGORY_LENGTH = 10;
export const ROSTER_MAX_ADD = 200;

// Used only to stop duplicates: full/half-width and stray spaces count as the same name.
// The worker has the same function; keep them in step.
export const toNameKey = (name: string) => name.normalize("NFKC").trim();

// One name per line. Lines are trimmed, blank lines dropped, and repeats kept once as first written.
export function splitNames(text: string): string[] {
  const seen = new Set<string>();
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(name => {
      const key = toNameKey(name);
      if (key === "" || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function sortRosterNames(names: RosterName[]): RosterName[] {
  return [...names].sort((a, b) => strCompare<RosterName>(a, b, "name"));
}

const quoteName = (name: string) => `「${name.length > 10 ? name.slice(0, 10) + "…" : name}」`;

export type AddBarState = {
  toSend: string[],    // names the add button will send; drives the 「N名」 count
  tooLong: string[],
  unchanged: string[], // already in the roster, with every selected category
  error?: string,      // the one-line message under the chips
}

// 名 counts people; 件 counts prop entries.
export const rosterCounter = (kind: RosterKind) => kind === "dancer" ? "名" : "件";

// What the add bar shows for the typed text and selected categories, before anything is sent.
export function getAddBarState(text: string, categoryIds: string[], roster: RosterList, kind: RosterKind = "dancer"): AddBarState {
  const names = splitNames(text);
  const byKey = new Map(roster.names.map(n => [toNameKey(n.name), n]));

  const tooLong = names.filter(n => n.length > SHORT_NAME_LENGTH);
  const unchanged = names.filter(n => {
    const existing = byKey.get(toNameKey(n));
    return n.length <= SHORT_NAME_LENGTH && existing !== undefined && categoryIds.every(c => existing.categoryIds.includes(c));
  });
  const toSend = names.filter(n => !tooLong.includes(n) && !unchanged.includes(n));

  let error: string | undefined;
  if (tooLong.length === 1) {
    error = `${quoteName(tooLong[0])}が長すぎます（${SHORT_NAME_LENGTH}文字まで）`;
  } else if (tooLong.length > 1) {
    error = `長すぎる名前が${tooLong.length}件あります（${SHORT_NAME_LENGTH}文字まで）`;
  } else if (toSend.length > ROSTER_MAX_ADD) {
    error = `一度に追加できるのは${ROSTER_MAX_ADD}${rosterCounter(kind)}までです`;
  } else if (unchanged.length === 1) {
    error = `${quoteName(unchanged[0])}はすでに名簿にあります`;
  } else if (unchanged.length > 1) {
    error = `${unchanged.length}件はすでに名簿にあります`;
  }

  return { toSend, tooLong, unchanged, error };
}

// The grey line after a successful add, e.g. 2名を追加・1名に旗士を追加しました, or for props
// 3件の道具を追加しました, naming the list so it's clear which tab took them.
export function getAddedSummary(added: number, updated: number, categoryNames: string[], kind: RosterKind = "dancer"): string {
  const categories = categoryNames.join("・");
  const counter = rosterCounter(kind);
  const parts = [
    added > 0 ? `${added}${counter}${kind === "prop" ? "の道具" : ""}を追加` : "",
    updated > 0 ? `${updated}${counter}に${categories}を追加` : "",
  ].filter(x => x !== "");
  if (parts.length === 0) {
    return "変更はありません";
  }
  const withCategories = added > 0 && updated === 0 && categories !== "" ? `（${categories}）` : "";
  return `${parts.join("・")}しました${withCategories}`;
}

export type PropLook = { length: number, width: number, color: string };

// What picking a prop name would change on a placed prop: only its defaults that are set and differ.
// Returns undefined when there's nothing to change, so no checkbox is shown.
export function getPropDefaultsChange(prop: PropLook, rosterName: RosterName): Partial<PropLook> | undefined {
  const change: Partial<PropLook> = {};
  if (rosterName.length !== undefined && rosterName.length !== prop.length) {
    change.length = rosterName.length;
  }
  if (rosterName.width !== undefined && rosterName.width !== prop.width) {
    change.width = rosterName.width;
  }
  // Colours are compared ignoring case: the palette and stored values may differ only in that.
  if (rosterName.color !== undefined && rosterName.color.toLowerCase() !== prop.color.toLowerCase()) {
    change.color = rosterName.color;
  }
  return Object.keys(change).length > 0 ? change : undefined;
}

// A name's default size as text, e.g. 縦1m × 幅4m, or just the one that's set.
export function formatPropSize(size: { length?: number, width?: number }): string {
  return [
    size.length !== undefined ? `縦${size.length}m` : "",
    size.width !== undefined ? `幅${size.width}m` : "",
  ].filter(x => x !== "").join(" × ");
}

// Selection mode

export type SelectAllState = "none" | "some" | "all";

// The すべて選択 row: whether everything shown is selected.
export function getSelectAllState(visibleIds: string[], selectedIds: Set<string>): SelectAllState {
  const count = visibleIds.filter(id => selectedIds.has(id)).length;
  return count === 0 ? "none" : count === visibleIds.length ? "all" : "some";
}

// Selected names that the filter or search currently hides.
export function countHidden(selectedIds: Set<string>, visibleIds: string[]): number {
  const visible = new Set(visibleIds);
  return [...selectedIds].filter(id => !visible.has(id)).length;
}

export type BulkCategoryOption = {
  id: string,
  name: string,
  isDisabled: boolean,
  note?: string, // e.g. 3名とも追加済み, 1名にあり, or for removing, 3名
}

// The category chips in the 区分を追加 / 区分を外す dialog, with how many selected names have each.
// Adding: one everyone has is disabled. Removing: only categories at least one selected name has.
export function getBulkCategoryOptions(list: RosterList, selectedIds: Set<string>, mode: "add" | "remove", kind: RosterKind): BulkCategoryOption[] {
  const counter = rosterCounter(kind);
  const selected = list.names.filter(n => selectedIds.has(n.id));
  const options = list.categories.map(c => ({ ...c, count: selected.filter(n => n.categoryIds.includes(c.id)).length }));
  if (mode === "remove") {
    return options.filter(o => o.count > 0).map(o => ({ id: o.id, name: o.name, isDisabled: false, note: `${o.count}${counter}` }));
  }
  return options.map(o => ({
    id: o.id,
    name: o.name,
    isDisabled: selected.length > 0 && o.count === selected.length,
    note: selected.length > 0 && o.count === selected.length
      ? `${o.count}${counter}とも追加済み`
      : o.count > 0 ? `${o.count}${counter}にあり` : undefined,
  }));
}

// Every selected name with every chosen category.
export function getPairs(nameIds: string[], categoryIds: string[]): RosterLink[] {
  return nameIds.flatMap(nameId => categoryIds.map(categoryId => [nameId, categoryId] as RosterLink));
}

// The result line after adding or removing, from what the server reports actually changed.
export function getLinksSummary(added: RosterLink[], removed: RosterLink[], list: RosterList, kind: RosterKind): string {
  const counter = rosterCounter(kind);
  const describe = (links: RosterLink[], verb: string) => {
    const names = new Set(links.map(([nameId]) => nameId)).size;
    const categories = [...new Set(links.map(([, categoryId]) => categoryId))]
      .map(id => list.categories.find(c => c.id === id)?.name ?? "")
      .join("・");
    return `${names}${counter}${verb === "add" ? "に" : "から"}${categories}を${verb === "add" ? "追加" : "外"}しました`;
  };
  if (added.length > 0) {
    return describe(added, "add");
  }
  if (removed.length > 0) {
    return describe(removed, "remove");
  }
  return "変更はありません";
}

export const getRemovedSummary = (count: number, kind: RosterKind) => `${count}${rosterCounter(kind)}を名簿から削除しました`;

// Bulk prop defaults

export type BulkLookField = "size" | "color";

// What the selected prop names have for one field, to start the 大きさ / 色 dialog from:
// the value they all share (undefined when none of them has one), or "mixed" when they differ.
export function getSharedLook(names: RosterName[], field: "size"): { length: number, width: number } | undefined | "mixed";
export function getSharedLook(names: RosterName[], field: "color"): string | undefined | "mixed";
export function getSharedLook(names: RosterName[], field: BulkLookField) {
  const keyOf = (n: RosterName) => field === "size"
    ? (n.length === undefined && n.width === undefined ? "" : `${n.length}×${n.width}`)
    : (n.color?.toLowerCase() ?? "");
  const keys = new Set(names.map(keyOf));
  if (keys.size > 1) {
    return "mixed";
  }
  const first = names[0];
  if (!first || keyOf(first) === "") {
    return undefined;
  }
  return field === "size"
    ? (first.length !== undefined && first.width !== undefined ? { length: first.length, width: first.width } : "mixed")
    : first.color;
}

// Whether any of the selected names has a default to clear.
export const hasAnyDefaults = (names: RosterName[]) =>
  names.some(n => n.length !== undefined || n.width !== undefined || n.color !== undefined);

// The result line after a bulk size or colour change, counted from the names that actually changed.
export function getDefaultsSummary(count: number, change: BulkLookField | "clear"): string {
  if (count === 0) {
    return "変更はありません";
  }
  return change === "size" ? `${count}件の大きさを変更しました`
    : change === "color" ? `${count}件の色を変更しました`
    : `${count}件の大きさと色を消しました`;
}
