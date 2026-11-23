import { DancerAction } from "../../models/dancerAction";
import { RosterSong, RosterSongSection } from "../../models/song";
import { strCompare } from "./globalHelper";
import { quoteName, splitNames, toNameKey } from "./rosterHelper";
import { SHORT_NAME_LENGTH } from "../consts/consts";

export const sortSongs = (songs: RosterSong[]) => [...songs].sort((a, b) => strCompare<RosterSong>(a, b, "name"));

// The 隊列表's song: the one with the name it kept. A renamed or deleted song leaves it with none.
export const findSong = (songs: RosterSong[] | undefined, songName: string | undefined) =>
  songName ? songs?.find(s => toNameKey(s.name) === toNameKey(songName)) : undefined;

export const findSongSection = (song: RosterSong | undefined, name: string): RosterSongSection | undefined =>
  song?.sections.find(s => toNameKey(s.name) === toNameKey(name));

// The song section to suggest for a section added after afterIndex: the first unused one after the
// nearest section (looking back from afterIndex) that's in the song.
export function nextSongSectionName(song: RosterSong, sectionNames: string[], afterIndex: number): string | undefined {
  const songKeys = song.sections.map(s => toNameKey(s.name));
  const used = new Set(sectionNames.map(toNameKey));
  for (let i = afterIndex; i >= 0; i--) {
    const position = songKeys.indexOf(toNameKey(sectionNames[i] ?? ""));
    if (position === -1) continue;
    const next = song.sections.slice(position + 1).find(s => !used.has(toNameKey(s.name)));
    if (next) return next.name;
  }
  return undefined;
}

// 「1・3・5・7」, or the first two, …, the last when there are more than 5, as the count patterns do.
export const formatCounts = (counts: string[]) => counts.length > 5
  ? [counts[0], counts[1], "…", counts[counts.length - 1]].join("・")
  : counts.join("・");

// A song section's 振り as a section's dancerActions: names and counts only, nobody assigned.
export const toDancerActions = (section: RosterSongSection): DancerAction[] =>
  section.actions.map(a => ({
    id: crypto.randomUUID(),
    name: a.name,
    timings: a.counts.map(count => ({ id: crypto.randomUUID(), name: count, dancerIds: [] })),
  }));

export type SongAddBarState = {
  toSend: string[],
  tooLong: string[],
  existing: string[],
  error?: string,
};

// The 曲 add bars' check before sending, worded like the 名簿's (where: 名簿 for songs, 曲 for sections).
export function getSongAddBarState(text: string, existingNames: string[], where: "名簿" | "曲", multiline: boolean): SongAddBarState {
  const names = multiline ? splitNames(text) : [text.trim()].filter(Boolean);
  const existingKeys = new Set(existingNames.map(toNameKey));
  const tooLong = names.filter(n => n.length > SHORT_NAME_LENGTH);
  const existing = names.filter(n => n.length <= SHORT_NAME_LENGTH && existingKeys.has(toNameKey(n)));
  const toSend = names.filter(n => !tooLong.includes(n) && !existing.includes(n));

  let error: string | undefined;
  if (tooLong.length === 1) {
    error = `${quoteName(tooLong[0])}が長すぎます（${SHORT_NAME_LENGTH}文字まで）`;
  } else if (tooLong.length > 1) {
    error = `長すぎる名前が${tooLong.length}件あります（${SHORT_NAME_LENGTH}文字まで）`;
  } else if (existing.length === 1) {
    error = `${quoteName(existing[0])}はすでに${where}にあります`;
  } else if (existing.length > 1) {
    error = `${existing.length}件はすでに${where}にあります`;
  }
  return { toSend, tooLong, existing, error };
}
