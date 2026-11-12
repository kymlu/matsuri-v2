import { buildFindDancerList, buildFindList, findMyDancerId, isSameDancerName, normalizeForSearch } from "./myDancerHelper";

const dancers = {
  a: { id: "a", name: "さくら" },
  b: { id: "b", name: "花子" },
  c: { id: "c", name: "花子" },
};

describe("isSameDancerName", () => {
  it("ignores spaces at either end and Latin case", () => {
    expect(isSameDancerName(" Aya ", "aya")).toBe(true);
    expect(isSameDancerName("ＡＹＡ", "ａｙａ")).toBe(true);
    expect(isSameDancerName("さくら", "サクラ")).toBe(false);
    expect(isSameDancerName("", "")).toBe(false);
  });
});

describe("findMyDancerId", () => {
  it("matches Latin names in any case", () =>
    expect(findMyDancerId({ x: { id: "x", name: "Mika" } }, "mika")).toBe("x"));
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

describe("buildFindList", () => {
  const props = [{ id: "p1", name: "大旗" }, { id: "p2", name: "幕" }, { id: "p3", name: "幕" }];
  it("numbers duplicates in the given order and sorts by reading", () => {
    expect(buildFindList(props, "").map(i => i.label)).toEqual(["大旗", "幕(1)", "幕(2)"]);
    expect(buildFindList(props, "").find(i => i.label === "幕(2)")?.id).toBe("p3");
  });
  it("filters by partial match", () => {
    expect(buildFindList(props, "旗").map(i => i.id)).toEqual(["p1"]);
    expect(buildFindList(props, "x")).toEqual([]);
  });
});
