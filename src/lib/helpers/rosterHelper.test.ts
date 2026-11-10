import { RosterList } from "../../models/roster";
import { countHidden, formatPropSize, getAddBarState, getAddedSummary, getBulkCategoryOptions, getDefaultsSummary, getLinksSummary, getSharedLook, hasAnyDefaults, getPairs, getPropDefaultsChange, getRemovedSummary, getSelectAllState, sortRosterNames, splitNames, toNameKey } from "./rosterHelper";

const roster: RosterList = {
  categories: [{ id: "c1", name: "正規" }, { id: "c2", name: "旗士" }],
  names: [
    { id: "n1", name: "さくら", categoryIds: ["c1"] },
    { id: "n2", name: "はると", categoryIds: ["c1", "c2"] },
  ],
};

describe("toNameKey", () => {
  it("treats width and surrounding spaces as the same name", () => {
    expect(toNameKey(" Ａ　")).toBe("A");
    expect(toNameKey("さくら")).not.toBe(toNameKey("桜"));
  });
});

describe("splitNames", () => {
  it("trims lines, drops blanks and keeps repeats once as first written", () => {
    expect(splitNames("Ａ\n\n  \nA \r\nさくら\nさくら\n")).toEqual(["Ａ", "さくら"]);
  });
});

describe("sortRosterNames", () => {
  it("sorts numbers by value", () => {
    const names = ["10", "2", "1"].map(name => ({ id: name, name, categoryIds: [] }));
    expect(sortRosterNames(names).map(n => n.name)).toEqual(["1", "2", "10"]);
  });
});

describe("getAddBarState", () => {
  it("sends new names with no message", () => {
    expect(getAddBarState("そうた\nあかり", [], roster)).toEqual({ toSend: ["そうた", "あかり"], tooLong: [], unchanged: [], error: undefined });
  });

  it("sends an existing name when it gains a category", () => {
    const state = getAddBarState("さくら", ["c2"], roster);
    expect(state.toSend).toEqual(["さくら"]);
    expect(state.error).toBeUndefined();
  });

  it("doesn't send an existing name that wouldn't change", () => {
    expect(getAddBarState("さくら", [], roster)).toMatchObject({ toSend: [], unchanged: ["さくら"], error: "「さくら」はすでに名簿にあります" });
    expect(getAddBarState("はると\nさくら\nそうた", ["c1"], roster)).toMatchObject({ toSend: ["そうた"], error: "2件はすでに名簿にあります" });
  });

  it("flags names over 15 characters, which take priority", () => {
    const state = getAddBarState("たかはしゆうたろうのおとうとくん\nさくら", [], roster);
    expect(state.toSend).toEqual([]);
    expect(state.error).toBe("「たかはしゆうたろうの…」が長すぎます（15文字まで）");
    expect(getAddBarState("あいうえおかきくけこさしすせそた\nあいうえおかきくけこさしすせそち", [], roster).error)
      .toBe("長すぎる名前が2件あります（15文字まで）");
  });

  it("counts only distinct non-blank names toward the limit", () => {
    const names = Array.from({ length: 200 }, (_, i) => `n${i}`);
    expect(getAddBarState([...names, "", ...names].join("\n"), [], roster).error).toBeUndefined();
    expect(getAddBarState([...names, "n200"].join("\n"), [], roster).error).toBe("一度に追加できるのは200名までです");
  });
});

describe("getAddedSummary", () => {
  it("describes what changed", () => {
    expect(getAddedSummary(2, 0, ["スポット"])).toBe("2名を追加しました（スポット）");
    expect(getAddedSummary(2, 0, [])).toBe("2名を追加しました");
    expect(getAddedSummary(1, 1, ["旗士"])).toBe("1名を追加・1名に旗士を追加しました");
    expect(getAddedSummary(0, 3, ["正規", "旗士"])).toBe("3名に正規・旗士を追加しました");
    expect(getAddedSummary(0, 0, [])).toBe("変更はありません");
  });
});

describe("props", () => {
  it("counts props with 件 and names the list in the summary", () => {
    expect(getAddedSummary(3, 0, [], "prop")).toBe("3件の道具を追加しました");
    expect(getAddedSummary(3, 0, ["旗"], "prop")).toBe("3件の道具を追加しました（旗）");
    expect(getAddedSummary(1, 1, ["旗"], "prop")).toBe("1件の道具を追加・1件に旗を追加しました");
    const names = Array.from({ length: 201 }, (_, i) => `p${i}`).join("\n");
    expect(getAddBarState(names, [], { categories: [], names: [] }, "prop").error).toBe("一度に追加できるのは200件までです");
  });

  const prop = { length: 1, width: 1, color: "#000000" };
  const name = (defaults: { length?: number, width?: number, color?: string }) => ({ id: "n", name: "大旗", categoryIds: [], ...defaults });

  it("finds only the defaults that are set and differ", () => {
    expect(getPropDefaultsChange(prop, name({}))).toBeUndefined();
    expect(getPropDefaultsChange(prop, name({ length: 1, width: 1, color: "#000000" }))).toBeUndefined();
    expect(getPropDefaultsChange(prop, name({ width: 4 }))).toEqual({ width: 4 });
    expect(getPropDefaultsChange(prop, name({ length: 1, width: 4, color: "#F08A00" }))).toEqual({ width: 4, color: "#F08A00" });
  });

  it("compares colours ignoring case", () => {
    expect(getPropDefaultsChange({ ...prop, color: "#f08a00" }, name({ color: "#F08A00" }))).toBeUndefined();
  });

  it("formats a size, or the part that's set", () => {
    expect(formatPropSize({ length: 1, width: 4 })).toBe("縦1m × 幅4m");
    expect(formatPropSize({ width: 4 })).toBe("幅4m");
    expect(formatPropSize({})).toBe("");
  });
});

describe("selection mode", () => {
  const list = {
    categories: [{ id: "c1", name: "正規" }, { id: "c2", name: "旗士" }, { id: "c3", name: "スポット" }],
    names: [
      { id: "a", name: "あおい", categoryIds: ["c1"] },
      { id: "s", name: "さくら", categoryIds: ["c1"] },
      { id: "h", name: "はると", categoryIds: ["c1", "c2"] },
      { id: "k", name: "かな", categoryIds: ["c3"] },
    ],
  };

  it("works out the すべて選択 state from what's shown", () => {
    expect(getSelectAllState(["a", "s"], new Set())).toBe("none");
    expect(getSelectAllState(["a", "s"], new Set(["a", "k"]))).toBe("some");
    expect(getSelectAllState(["a", "s"], new Set(["a", "s", "k"]))).toBe("all");
  });

  it("counts selected names that are hidden", () => {
    expect(countHidden(new Set(["a", "s", "k"]), ["k"])).toBe(2);
    expect(countHidden(new Set(["k"]), ["k", "a"])).toBe(0);
  });

  it("disables a category everyone selected has, and says how many have the rest", () => {
    expect(getBulkCategoryOptions(list, new Set(["a", "s", "h"]), "add", "dancer")).toEqual([
      { id: "c1", name: "正規", isDisabled: true, note: "3名とも追加済み" },
      { id: "c2", name: "旗士", isDisabled: false, note: "1名にあり" },
      { id: "c3", name: "スポット", isDisabled: false, note: undefined },
    ]);
  });

  it("offers only categories someone selected has when removing", () => {
    expect(getBulkCategoryOptions(list, new Set(["a", "h"]), "remove", "prop")).toEqual([
      { id: "c1", name: "正規", isDisabled: false, note: "2件" },
      { id: "c2", name: "旗士", isDisabled: false, note: "1件" },
    ]);
  });

  it("pairs every selected name with every chosen category", () => {
    expect(getPairs(["a", "s"], ["c1", "c2"])).toEqual([["a", "c1"], ["a", "c2"], ["s", "c1"], ["s", "c2"]]);
  });

  it("describes what actually changed", () => {
    expect(getLinksSummary([["a", "c2"], ["s", "c2"]], [], list, "dancer")).toBe("2名に旗士を追加しました");
    expect(getLinksSummary([], [["a", "c1"], ["a", "c3"]], list, "prop")).toBe("1件から正規・スポットを外しました");
    expect(getLinksSummary([], [], list, "dancer")).toBe("変更はありません");
    expect(getRemovedSummary(3, "dancer")).toBe("3名を名簿から削除しました");
  });
});

describe("bulk prop defaults", () => {
  const flag = { id: "a", name: "大旗", categoryIds: [], length: 1, width: 4, color: "#F08A00" };
  const flag2 = { id: "b", name: "中旗", categoryIds: [], length: 1, width: 4, color: "#f08a00" };
  const plain = { id: "c", name: "扇", categoryIds: [] };

  it("finds the size or colour every selected name shares", () => {
    expect(getSharedLook([flag, flag2], "size")).toEqual({ length: 1, width: 4 });
    expect(getSharedLook([flag, flag2], "color")).toBe("#F08A00");
    expect(getSharedLook([plain], "size")).toBeUndefined();
    expect(getSharedLook([plain], "color")).toBeUndefined();
  });

  it("calls it mixed when they differ, including some with none", () => {
    expect(getSharedLook([flag, { ...flag2, width: 2 }], "size")).toBe("mixed");
    expect(getSharedLook([flag, plain], "color")).toBe("mixed");
    expect(getSharedLook([{ ...plain, length: 2 }], "size")).toBe("mixed");
  });

  it("knows whether there is anything to clear", () => {
    expect(hasAnyDefaults([plain])).toBe(false);
    expect(hasAnyDefaults([plain, { ...plain, color: "#000000" }])).toBe(true);
  });

  it("words the result from what changed", () => {
    expect(getDefaultsSummary(3, "size")).toBe("3件の大きさを変更しました");
    expect(getDefaultsSummary(2, "color")).toBe("2件の色を変更しました");
    expect(getDefaultsSummary(1, "clear")).toBe("1件の大きさと色を消しました");
    expect(getDefaultsSummary(0, "color")).toBe("変更はありません");
  });
});
