import { Formation } from "../../models/choreoSection";
import { canPlanShortestMoves, planShortestMoves } from "./shortestMove";

const dp = (id: string, x: number, y: number, color = "red") => ({ dancerId: id, x, y, z: 0, color, sectionId: "s", type: "dancer" as const });
const formation = (people: ReturnType<typeof dp>[], extra: Partial<Formation> = {}): Formation => ({
  dancerPositions: Object.fromEntries(people.map(p => [p.dancerId, p])),
  dancerActions: [],
  propPositions: {},
  ...extra,
});
const none = { dancers: [] as string[], props: [] as string[], obstacles: [] as string[] };
const only = (...dancers: string[]) => ({ ...none, dancers });

// a and b start on the left and right, but their spots in this section make their routes cross.
const prev = formation([dp("a", 0, 0), dp("b", 10, 0)]);
const crossed = formation([dp("a", 10, 5), dp("b", 0, 5)]);

describe("canPlanShortestMoves", () => {
  it("needs a previous section and two people outside stacks", () => {
    expect(canPlanShortestMoves(undefined, crossed, none)).toBe(false);
    expect(canPlanShortestMoves(prev, crossed, only("a"))).toBe(false);
    expect(canPlanShortestMoves(prev, crossed, only("a", "b"))).toBe(true);
    expect(canPlanShortestMoves(prev, crossed, none)).toBe(true); // nothing selected means everyone
    expect(canPlanShortestMoves(prev, crossed, { ...none, props: ["p"] })).toBe(false); // only props selected
    expect(canPlanShortestMoves(prev, { ...crossed, dancerStacks: [["a", "b"]] }, none)).toBe(false);
  });
});

describe("planShortestMoves", () => {
  it("uncrosses a crossing pair", () => {
    const plan = planShortestMoves(prev, crossed, none, { sameColour: true });
    expect(plan.moves).toEqual([{ unit: ["a"], target: ["b"] }, { unit: ["b"], target: ["a"] }]);
    expect(plan.totalAfter).toBeCloseTo(10);
    expect(plan.totalBefore).toBeCloseTo(2 * Math.hypot(10, 5));
  });

  it("leaves an already shortest arrangement alone, including ties", () => {
    const straight = formation([dp("a", 0, 5), dp("b", 10, 5)]);
    expect(planShortestMoves(prev, straight, none, { sameColour: true }).moves).toEqual([]);
    // Both people start on the same spot: any arrangement costs the same, so nobody moves.
    const same = formation([dp("a", 5, 0), dp("b", 5, 0)]);
    expect(planShortestMoves(same, crossed, none, { sameColour: true }).moves).toEqual([]);
  });

  it("only swaps within a colour unless told otherwise", () => {
    const mixed = formation([dp("a", 10, 5, "red"), dp("b", 0, 5, "blue")]);
    expect(planShortestMoves(prev, mixed, none, { sameColour: true }).moves).toEqual([]);
    expect(planShortestMoves(prev, mixed, none, { sameColour: false }).moves).toHaveLength(2);
  });

  it("ignores savings under 0.5 m", () => {
    const close = formation([dp("a", 0.2, 0), dp("b", 0, 0)]); // swapping saves 0.4 m
    const start = formation([dp("a", 0, 0), dp("b", 0.2, 0)]);
    const plan = planShortestMoves(start, close, none, { sameColour: true });
    expect(plan.moves).toEqual([]);
    expect(plan.totalAfter).toBe(plan.totalBefore);
  });

  it("never moves stacked people and says it skipped them", () => {
    const withStack = formation([dp("a", 10, 5), dp("b", 0, 5), dp("c", 3, 3), dp("d", 3, 3)], { dancerStacks: [["c", "d"]] });
    const plan = planShortestMoves({ ...prev, dancerPositions: { ...prev.dancerPositions, c: dp("c", 9, 9), d: dp("d", 9, 9) } }, withStack, none, { sameColour: true });
    expect(plan.moves.map(m => m.unit[0]).sort()).toEqual(["a", "b"]);
    expect(plan.considered.sort()).toEqual(["a", "b"]);
    expect(plan.skippedStacked).toBe(true);
    expect(planShortestMoves(prev, crossed, none, { sameColour: true }).skippedStacked).toBe(false);
  });

  it("keeps people who weren't in the previous section where they are", () => {
    const withNew = formation([dp("a", 10, 5), dp("b", 0, 5), dp("n", 5, 5)]);
    const plan = planShortestMoves(prev, withNew, none, { sameColour: true });
    expect(plan.considered.sort()).toEqual(["a", "b"]);
    expect(plan.moves.some(m => m.unit[0] === "n" || m.target[0] === "n")).toBe(false);
  });

  it("only moves selected people", () => {
    const three = formation([dp("a", 10, 5), dp("b", 0, 5), dp("c", 20, 5)]);
    const start = formation([dp("a", 0, 0), dp("b", 10, 0), dp("c", 20, 0)]);
    const plan = planShortestMoves(start, three, only("a", "c"), { sameColour: true });
    expect(plan.moves.every(m => m.unit[0] !== "b")).toBe(true);
  });

  it("says when someone who moves has counts", () => {
    const counted = { ...crossed, dancerActions: [{ id: "x", name: "手上げ", timings: [{ id: "t", name: "1", dancerIds: ["a"] }] }] };
    expect(planShortestMoves(prev, counted, none, { sameColour: true }).countsAffected).toBe(true);
    expect(planShortestMoves(prev, crossed, none, { sameColour: true }).countsAffected).toBe(false);
  });
});
