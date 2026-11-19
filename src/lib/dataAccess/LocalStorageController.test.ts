import { getLastSeenChoreo, setLastSeenChoreo } from "./LocalStorageController";

describe("last seen choreo", () => {
  beforeEach(() => localStorage.clear());

  test("is saved per team and cleared", () => {
    setLastSeenChoreo("team1", "a");
    setLastSeenChoreo(undefined, "b");
    expect(getLastSeenChoreo("team1")).toBe("a");
    expect(getLastSeenChoreo("team2")).toBeNull();
    expect(getLastSeenChoreo()).toBe("b");
    setLastSeenChoreo("team1", undefined);
    expect(getLastSeenChoreo("team1")).toBeNull();
  });
});
