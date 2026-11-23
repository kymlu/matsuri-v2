import { DancerAction } from "../../models/dancerAction";
import { RosterSong, RosterSongSection } from "../../models/song";
import { strCompare } from "./globalHelper";
import { toNameKey } from "./rosterHelper";

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
