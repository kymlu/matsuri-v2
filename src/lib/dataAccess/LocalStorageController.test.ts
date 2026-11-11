import { clearSeenVersion, getSeenVersion, setSeenVersion } from "./LocalStorageController";

describe("seen version", () => {
  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("returns undefined when nothing is stored", () => {
    expect(getSeenVersion("c1")).toBeUndefined();
  });

  it("stores, reads and clears a version per choreo", () => {
    setSeenVersion("c1", 3);
    setSeenVersion("c2", 5);
    expect(getSeenVersion("c1")).toBe(3);
    expect(getSeenVersion("c2")).toBe(5);

    clearSeenVersion("c1");
    expect(getSeenVersion("c1")).toBeUndefined();
    expect(getSeenVersion("c2")).toBe(5);
  });

  it.each(["abc", "0", "-1", "1.5", ""])("ignores an invalid stored value %p", (value) => {
    localStorage.setItem("seen_version_c1", value);
    expect(getSeenVersion("c1")).toBeUndefined();
  });

  it("does nothing when storage is unavailable", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error(); });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error(); });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error(); });
    expect(() => setSeenVersion("c1", 1)).not.toThrow();
    expect(() => clearSeenVersion("c1")).not.toThrow();
    expect(getSeenVersion("c1")).toBeUndefined();
  });
});

describe("my dancer name", () => {
  const { getMyDancerName, setMyDancerName } = require("./LocalStorageController");
  afterEach(() => localStorage.clear());

  it("falls back to the old device-wide name for a team not yet saved", () => {
    localStorage.setItem("USERNAME", "さくら");
    expect(getMyDancerName("t1")).toBe("さくら");
  });

  it("keeps names per team", () => {
    setMyDancerName("t1", "さくら");
    setMyDancerName("t2", "花子");
    expect(getMyDancerName("t1")).toBe("さくら");
    expect(getMyDancerName("t2")).toBe("花子");
    expect(getMyDancerName()).toBeNull();
  });

  it("keeps a cleared team name instead of falling back", () => {
    localStorage.setItem("USERNAME", "さくら");
    setMyDancerName("t1", " ");
    expect(getMyDancerName("t1")).toBe("");
  });

  it("uses the device-wide key outside a team", () => {
    setMyDancerName(undefined, "ゆい");
    expect(localStorage.getItem("USERNAME")).toBe("ゆい");
  });
});
