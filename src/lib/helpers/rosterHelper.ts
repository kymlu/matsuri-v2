import { SHORT_NAME_LENGTH } from "../consts/consts";
import { Roster, RosterName } from "../../models/roster";
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

// What the add bar shows for the typed text and selected categories, before anything is sent.
export function getAddBarState(text: string, categoryIds: string[], roster: Roster): AddBarState {
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
    error = `一度に追加できるのは${ROSTER_MAX_ADD}名までです`;
  } else if (unchanged.length === 1) {
    error = `${quoteName(unchanged[0])}はすでに名簿にあります`;
  } else if (unchanged.length > 1) {
    error = `${unchanged.length}件はすでに名簿にあります`;
  }

  return { toSend, tooLong, unchanged, error };
}

// The grey line after a successful add, e.g. 2名を追加・1名に旗士を追加しました.
export function getAddedSummary(added: number, updated: number, categoryNames: string[]): string {
  const categories = categoryNames.join("・");
  const parts = [
    added > 0 ? `${added}名を追加` : "",
    updated > 0 ? `${updated}名に${categories}を追加` : "",
  ].filter(x => x !== "");
  if (parts.length === 0) {
    return "変更はありません";
  }
  const withCategories = added > 0 && updated === 0 && categories !== "" ? `（${categories}）` : "";
  return `${parts.join("・")}しました${withCategories}`;
}
