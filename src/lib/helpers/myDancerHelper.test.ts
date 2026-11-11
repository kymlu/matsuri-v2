import { findMyDancerId, resolveMyDancerName } from "./myDancerHelper";

const dancers = {
  a: { id: "a", name: "さくら" },
  b: { id: "b", name: "花子" },
  c: { id: "c", name: "花子" },
};

describe("resolveMyDancerName", () => {
  it("prefers the saved name", () => expect(resolveMyDancerName("さくら", "山田")).toBe("さくら"));
  it("keeps a cleared name cleared", () => expect(resolveMyDancerName("", "山田")).toBe(""));
  it("guesses the account name when nothing was saved", () => expect(resolveMyDancerName(null, "山田")).toBe("山田"));
  it("is null with neither", () => expect(resolveMyDancerName(null, "")).toBeNull());
});

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
