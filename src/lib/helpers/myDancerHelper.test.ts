import { buildFindDancerList, findMyDancerId, normalizeForSearch } from "./myDancerHelper";

const dancers = {
  a: { id: "a", name: "さくら" },
  b: { id: "b", name: "花子" },
  c: { id: "c", name: "花子" },
};

describe("findMyDancerId", () => {
  it("finds a single match", () => expect(findMyDancerId(dancers, "さくら")).toBe("a"));
  it("ignores surrounding spaces", () => expect(findMyDancerId(dancers, " さくら ")).toBe("a"));
  it("skips duplicate names", () => expect(findMyDancerId(dancers, "花子")).toBeUndefined());
  it("skips no match and blanks", () => {
    expect(findMyDancerId(dancers, "ゆい")).toBeUndefined();
    expect(findMyDancerId(dancers, "")).toBeUndefined();
    expect(findMyDancerId(dancers, null)).toBeUndefined();
  });
});

describe("normalizeForSearch", () => {
  it("treats katakana as hiragana and folds widths", () => {
    expect(normalizeForSearch("ユイ")).toBe("ゆい");
    expect(normalizeForSearch("ﾕｲ")).toBe("ゆい");
    expect(normalizeForSearch("Ａｙａ Ｋｏ")).toBe("ayako");
  });
});

describe("buildFindDancerList", () => {
  const list = (shown?: string, me?: string, q = "") =>
    buildFindDancerList({ ...dancers, d: { id: "d", name: "あやか" } }, shown, me, q);

  it("numbers duplicate names in choreo order", () => {
    expect(list().map(i => i.label)).toEqual(["あやか", "さくら", "花子(1)", "花子(2)"]);
    expect(list().find(i => i.label === "花子(2)")?.id).toBe("c");
  });

  it("puts the shown dancer first, then me", () => {
    expect(list("c", "a").map(i => i.id).slice(0, 2)).toEqual(["c", "a"]);
  });

  it("filters by partial match across kana", () => {
    expect(list(undefined, undefined, "サク").map(i => i.id)).toEqual(["a"]);
    expect(list(undefined, undefined, "花子").length).toBe(2);
    expect(list(undefined, undefined, "ゆい")).toEqual([]);
  });
});
