import { Dancer } from "../../models/dancer";
import { isNullOrUndefinedOrBlank, strEquals } from "./globalHelper";

// The name to match "me" by: the saved name if one was ever saved (blank means cleared on purpose),
// otherwise the logged-in account name as a first guess.
export function resolveMyDancerName(savedName: string | null, accountName?: string | null): string | null {
  if (savedName !== null) return savedName;
  return isNullOrUndefinedOrBlank(accountName) ? null : accountName!;
}

// The id of the one dancer with exactly this name. Two or more matches are left for the user to pick.
export function findMyDancerId(dancers: Record<string, Dancer>, name: string | null | undefined): string | undefined {
  if (isNullOrUndefinedOrBlank(name?.trim())) return undefined;
  const matches = Object.values(dancers).filter(d => strEquals(d.name.trim(), name!.trim()));
  return matches.length === 1 ? matches[0].id : undefined;
}

// For search: full-width/half-width folded, katakana as hiragana, Latin in lower case.
export function normalizeForSearch(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, "")
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export type FindDancerItem = { id: string, label: string, isShown: boolean, isMe: boolean };

// The list for the find-dancer dialog. Duplicate names get (1), (2)… in choreo order, so the
// numbers stay the same each time. Order: the dancer shown now, then "me", then the rest by reading.
export function buildFindDancerList(
  dancers: Record<string, Dancer>,
  shownId: string | undefined,
  myDancerId: string | undefined,
  searchTerm: string,
): FindDancerItem[] {
  const all = Object.values(dancers);
  const counts: Record<string, number> = {};
  all.forEach(d => { counts[d.name.trim()] = (counts[d.name.trim()] ?? 0) + 1; });
  const seen: Record<string, number> = {};
  const items = all.map(d => {
    const name = d.name.trim();
    const label = counts[name] > 1 ? `${name}(${seen[name] = (seen[name] ?? 0) + 1})` : name;
    return { id: d.id, label, isShown: d.id === shownId, isMe: d.id === myDancerId };
  });
  const query = normalizeForSearch(searchTerm);
  const rank = (i: FindDancerItem) => i.isShown ? 0 : i.isMe ? 1 : 2;
  const collator = new Intl.Collator("ja");
  return items
    .filter(i => query === "" || normalizeForSearch(i.label).includes(query))
    .sort((a, b) => rank(a) - rank(b) || collator.compare(a.label, b.label));
}
