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

// Display labels with duplicate names numbered (1), (2)… in the given order, so the numbers
// stay the same each time. Same key as isSameDancerName, so names it treats as one are numbered too.
export function numberDuplicateNames(named: { id: string, name: string }[]): Record<string, string> {
  const key = (n: { name: string }) => n.name.trim().toLowerCase();
  const counts: Record<string, number> = {};
  named.forEach(n => { counts[key(n)] = (counts[key(n)] ?? 0) + 1; });
  const seen: Record<string, number> = {};
  const labels: Record<string, string> = {};
  named.forEach(n => {
    const name = n.name.trim();
    labels[n.id] = counts[key(n)] > 1 ? `${name}(${seen[key(n)] = (seen[key(n)] ?? 0) + 1})` : name;
  });
  return labels;
}

// The list for the find-dancer dialog. Order: the dancer shown now, then "me", then the rest by reading.
export function buildFindDancerList(
  dancers: Record<string, Dancer>,
  shownId: string | undefined,
  myDancerId: string | undefined,
  searchTerm: string,
): FindDancerItem[] {
  const labels = numberDuplicateNames(Object.values(dancers));
  const items = Object.values(dancers).map(d =>
    ({ id: d.id, label: labels[d.id], isShown: d.id === shownId, isMe: d.id === myDancerId }));
  const query = normalizeForSearch(searchTerm);
  const rank = (i: FindDancerItem) => i.isShown ? 0 : i.isMe ? 1 : 2;
  const collator = new Intl.Collator("ja");
  return items
    .filter(i => query === "" || normalizeForSearch(i.label).includes(query))
    .sort((a, b) => rank(a) - rank(b) || collator.compare(a.label, b.label));
}

// The editor's find list: everything given, labelled, filtered by the search and sorted by reading.
// Unlike the viewer's list, nothing moves to the top, so rows stay put while ticking.
export function buildFindList(named: { id: string, name: string }[], searchTerm: string): { id: string, label: string }[] {
  const labels = numberDuplicateNames(named);
  const query = normalizeForSearch(searchTerm);
  const collator = new Intl.Collator("ja");
  return named
    .map(n => ({ id: n.id, label: labels[n.id] }))
    .filter(i => query === "" || normalizeForSearch(i.label).includes(query))
    .sort((a, b) => collator.compare(a.label, b.label));
}
