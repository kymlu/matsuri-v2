import { getChoreoSummary } from "./apiHelper";

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
