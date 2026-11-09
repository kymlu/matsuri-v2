import { Roster } from "../../models/roster";
import { getAddBarState, getAddedSummary, sortRosterNames, splitNames, toNameKey } from "./rosterHelper";

const roster: Roster = {
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
