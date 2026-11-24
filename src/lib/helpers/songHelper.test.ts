import { RosterSong } from "../../models/song";
import { findSong, findSongSection, formatCounts, getSongAddBarState, nextSongSectionName, sortSongs, toDancerActions } from "./songHelper";
import { randomUUID } from "crypto";

// jsdom has no crypto.randomUUID.
beforeAll(() => {
  if (!globalThis.crypto?.randomUUID) {
    Object.defineProperty(globalThis, "crypto", { value: { ...globalThis.crypto, randomUUID }, configurable: true });
  }
});

const section = (name: string, actions: { name: string, counts: string[] }[] = []) =>
  ({ id: name, name, actions: actions.map(a => ({ id: a.name, ...a })) });

const song: RosterSong = {
  id: "s1",
  name: "演舞2026",
  sections: ["OP", "Aメロ", "Bメロ", "サビ", "間奏", "ラスト"].map(n => section(n)),
};

describe("findSong", () => {
  it("finds the song by its id, whatever it's called now", () => {
    expect(findSong([{ ...song, name: "新しい名前" }], song.id)?.name).toBe("新しい名前");
  });

  it("finds nothing for no id, or a deleted song", () => {
    expect(findSong([song], undefined)).toBeUndefined();
    expect(findSong([song], "deleted")).toBeUndefined();
    expect(findSong(undefined, song.id)).toBeUndefined();
  });
});

describe("nextSongSectionName", () => {
  const next = (names: string[], afterIndex = names.length - 1) => nextSongSectionName(song, names, afterIndex);

  it("takes the song section after the last one", () => {
    expect(next(["OP"])).toBe("Aメロ");
  });

  it("looks back past sections that aren't in the song", () => {
    expect(next(["OP", "Aメロ", "ソロ"])).toBe("Bメロ");
  });

  it("doesn't bring back a skipped section", () => {
    expect(next(["OP", "Bメロ"])).toBe("サビ");
  });

  it("skips sections already in the 隊列表 when adding in the middle", () => {
    expect(next(["OP", "Aメロ", "Bメロ"], 0)).toBe("サビ");
  });

  it("has nothing when the song runs out or nothing matches", () => {
    expect(next(["OP", "Aメロ", "Bメロ", "サビ", "間奏", "ラスト"])).toBeUndefined();
    expect(next(["ソロ"])).toBeUndefined();
  });
});

describe("formatCounts", () => {
  it("lists up to 5 counts in full, and shortens longer ones", () => {
    expect(formatCounts(["1", "3", "5", "7"])).toBe("1・3・5・7");
    expect(formatCounts(["1", "2", "3", "4", "5", "6", "7", "8"])).toBe("1・2・…・8");
  });
});

describe("toDancerActions", () => {
  it("copies names and counts with nobody assigned", () => {
    const actions = toDancerActions(section("サビ", [{ name: "回転", counts: ["1", "3"] }]));
    expect(actions).toHaveLength(1);
    expect(actions[0].name).toBe("回転");
    expect(actions[0].timings.map(t => [t.name, t.dancerIds])).toEqual([["1", []], ["3", []]]);
  });
});

describe("other helpers", () => {
  it("sorts songs by name and finds sections ignoring width", () => {
    expect(sortSongs([{ ...song, name: "総踊り" }, song]).map(s => s.name)).toEqual(["演舞2026", "総踊り"]);
    expect(findSongSection(song, "Ａメロ")?.name).toBe("Aメロ");
  });
});

describe("getSongAddBarState", () => {
  it("sends new names and words problems like the 名簿", () => {
    expect(getSongAddBarState("サビ\nラスト", ["OP"], "曲", true)).toEqual({ toSend: ["サビ", "ラスト"], tooLong: [], existing: [], error: undefined });
    expect(getSongAddBarState("ＯＰ\nサビ", ["OP"], "曲", true).error).toBe("「ＯＰ」はすでに曲にあります");
    expect(getSongAddBarState("OP\nAメロ", ["OP", "Aメロ"], "曲", true).error).toBe("2件はすでに曲にあります");
    expect(getSongAddBarState("あいうえおかきくけこさしすせそた", [], "名簿", false).error).toBe("「あいうえおかきくけこ…」が長すぎます（15文字まで）");
  });
});
