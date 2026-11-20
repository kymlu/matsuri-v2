import { ChoreoLockedError, getChoreoFile, getChoreoSummary } from "./apiHelper";
import { checkUnlockedChoreo, setUnlockedChoreo } from "../dataAccess/LocalStorageController";

describe("getChoreoSummary", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; jest.restoreAllMocks(); });
  beforeEach(() => { jest.spyOn(console, "error").mockImplementation(() => {}); });

  it("is empty without a team, without asking the server", async () => {
    global.fetch = jest.fn();
    expect(await getChoreoSummary(undefined)).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns the team's charts", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "c1" }] });
    expect(await getChoreoSummary("t1")).toEqual([{ id: "c1" }]);
  });

  it("is undefined when the request fails, so the home page can say so", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await getChoreoSummary("t1")).toBeUndefined();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: "x" }) });
    expect(await getChoreoSummary("t1")).toBeUndefined();
  });
});

describe("getChoreoFile", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; jest.restoreAllMocks(); localStorage.clear(); });
  beforeEach(() => { jest.spyOn(console, "error").mockImplementation(() => {}); });

  it("sends the saved unlock token and the login cookie", async () => {
    setUnlockedChoreo("c1", "tok");
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "c1" }) });
    await getChoreoFile("t1", "c1", 2);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("choreo_id=c1"),
      { credentials: "include", headers: { "X-Choreo-Unlock": "tok" } });
  });

  it("sends no token header for a choreo without one", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "c1" }) });
    await getChoreoFile("t1", "c1", 2);
    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), { credentials: "include", headers: undefined });
  });

  it("drops the token and throws ChoreoLockedError when the server wants the password", async () => {
    setUnlockedChoreo("c1", "old");
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: "x", code: "locked" }) });
    await expect(getChoreoFile("t1", "c1", 2)).rejects.toBeInstanceOf(ChoreoLockedError);
    expect(checkUnlockedChoreo("c1")).toBe(false);
  });

  it("keeps the token for other failures", async () => {
    setUnlockedChoreo("c1", "tok");
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: "x" }) });
    await expect(getChoreoFile("t1", "c1", 2)).rejects.not.toBeInstanceOf(ChoreoLockedError);
    expect(checkUnlockedChoreo("c1")).toBe(true);
  });
});
