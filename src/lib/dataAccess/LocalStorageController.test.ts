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
