import { Dancer } from "../../models/dancer";
import { isNullOrUndefinedOrBlank } from "./globalHelper";

// Whether two dancer names are the same name: spaces at either end ignored, and Latin letters in any case.
export function isSameDancerName(a: string | null | undefined, b: string | null | undefined): boolean {
  if (isNullOrUndefinedOrBlank(a?.trim()) || isNullOrUndefinedOrBlank(b?.trim())) return false;
  return a!.trim().toLowerCase() === b!.trim().toLowerCase();
}

// The id of the one dancer with exactly this name. Two or more matches are left for the user to pick.
export function findMyDancerId(dancers: Record<string, Dancer>, name: string | null | undefined): string | undefined {
  const matches = Object.values(dancers).filter(d => isSameDancerName(d.name, name));
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
  // Same key as isSameDancerName, so names it treats as one are numbered too.
  const key = (d: Dancer) => d.name.trim().toLowerCase();
  all.forEach(d => { counts[key(d)] = (counts[key(d)] ?? 0) + 1; });
  const seen: Record<string, number> = {};
  const items = all.map(d => {
    const name = d.name.trim();
    const label = counts[key(d)] > 1 ? `${name}(${seen[key(d)] = (seen[key(d)] ?? 0) + 1})` : name;
    return { id: d.id, label, isShown: d.id === shownId, isMe: d.id === myDancerId };
  });
  const query = normalizeForSearch(searchTerm);
  const rank = (i: FindDancerItem) => i.isShown ? 0 : i.isMe ? 1 : 2;
  const collator = new Intl.Collator("ja");
  return items
    .filter(i => query === "" || normalizeForSearch(i.label).includes(query))
    .sort((a, b) => rank(a) - rank(b) || collator.compare(a.label, b.label));
}
