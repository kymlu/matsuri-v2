import { countBadges } from "./countBadgeHelper";
import { DancerAction } from "../../models/dancerAction";

const action: DancerAction = {
  id: "a1", name: "手上げ",
  timings: [{ id: "t1", name: "1", dancerIds: ["d1", "d4"] }, { id: "t3", name: "3", dancerIds: ["d2", "d5"] }],
};

describe("countBadges", () => {
  it("gives each dancer their count, red for the chosen one", () => {
    expect(countBadges(action, "t3", undefined)).toEqual({
      d1: { text: "1", red: false }, d4: { text: "1", red: false },
      d2: { text: "3", red: true }, d5: { text: "3", red: true },
    });
  });

  it("gives nothing without an action", () => {
    expect(countBadges(undefined, undefined, [["d1", "d2"]])).toEqual({});
  });

  it("lists a stack's counts on its top, top first", () => {
    // d2 is on top of d1.
    expect(countBadges(action, undefined, [["d1", "d2"]]).d2).toEqual({ text: "3/1", red: false });
  });

  it("marks members without a count, and is red when any member is", () => {
    // d3 (no count) is on top of d2.
    expect(countBadges(action, "t3", [["d2", "d3"]]).d3).toEqual({ text: "–/3", red: true });
  });

  it("shows one name when the whole stack shares a count", () => {
    expect(countBadges(action, undefined, [["d1", "d4"]]).d4).toEqual({ text: "1", red: false });
  });

  it("leaves a stack with no counts without a badge", () => {
    expect(countBadges(action, undefined, [["d8", "d9"]]).d9).toBeUndefined();
  });
});
