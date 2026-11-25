import { StageGeometry } from "../../models/choreo";
import { METER_PX } from "../consts/consts";
import { addToSelection, BoxSelectInput, idsInBox } from "./boxSelectHelper";

const geometry: StageGeometry = {
  stageWidth: 10, stageLength: 8, yAxis: "top-down",
  margin: { topMargin: 2, bottomMargin: 2, leftMargin: 2, rightMargin: 2 },
};
// Stage metres to stage px, as dancers are drawn.
const px = (x: number, y: number) => ({ x: (x + 2) * METER_PX, y: (y + 2) * METER_PX });

// Prop "p": 2m x 1m with its top-left at (1,3). Obstacle "o": 1m square at (6,1).
const bounds: Record<string, { x: number, y: number, width: number, height: number }> = {
  p: { ...px(1, 3), width: 2 * METER_PX, height: 1 * METER_PX },
  o: { ...px(6, 1), width: 1 * METER_PX, height: 1 * METER_PX },
};

const base: BoxSelectInput = {
  geometry,
  dancerPositions: [
    { dancerId: "a", x: 1, y: 1, color: "#f00", sectionId: "s", type: "dancer" as const },
    { dancerId: "b", x: 3, y: 1, color: "#f00", sectionId: "s", type: "dancer" as const },
    { dancerId: "c", x: 8, y: 6, color: "#f00", sectionId: "s", type: "dancer" as const },
  ],
  propIds: ["p"],
  obstacleIds: ["o"],
  boundsOf: id => bounds[id],
  canSelectDancers: true,
  canSelectProps: true,
  canSelectObstacles: true,
};

describe("idsInBox", () => {
  it("catches dancers whose centre is inside, whichever corner the drag started from", () => {
    expect(idsInBox(px(0, 0), px(4, 2), base).dancers).toEqual(["a", "b"]);
    expect(idsInBox(px(4, 2), px(0, 0), base).dancers).toEqual(["a", "b"]);
  });

  it("catches props and obstacles only when wholly inside", () => {
    // Covers the prop's centre but not its right end.
    expect(idsInBox(px(0.5, 2.5), px(2.5, 4.5), base).props).toEqual([]);
    expect(idsInBox(px(0.5, 2.5), px(3.5, 4.5), base).props).toEqual(["p"]);
    expect(idsInBox(px(5.9, 0.9), px(7.1, 2.1), base).obstacles).toEqual(["o"]);
    expect(idsInBox(px(5.9, 0.9), px(6.9, 2.1), base).obstacles).toEqual([]);
  });

  it("skips kinds that can't be selected and excluded dancers", () => {
    const r = idsInBox(px(0, 0), px(10, 8), { ...base, canSelectObstacles: false, canSelectProps: false, excludedDancerIds: new Set(["b"]) });
    expect(r).toEqual({ dancers: ["a", "c"], props: [], obstacles: [] });
  });

  it("skips anything not drawn", () => {
    expect(idsInBox(px(0, 0), px(10, 8), { ...base, boundsOf: () => undefined }).props).toEqual([]);
  });

  it("works when y counts from the back", () => {
    const bottomUp = { ...base, geometry: { ...geometry, yAxis: "bottom-up" as const } };
    // y=1 from the back of an 8m stage is 7m down from the top edge.
    expect(idsInBox(px(0, 6.5), px(4, 7.5), bottomUp).dancers).toEqual(["a", "b"]);
  });
});

describe("addToSelection", () => {
  it("adds without removing or duplicating", () => {
    const current = { dancers: ["a"], props: [], obstacles: [] };
    expect(addToSelection(current, { dancers: ["a", "b"], props: ["p"], obstacles: [] }))
      .toEqual({ dancers: ["a", "b"], props: ["p"], obstacles: [] });
  });

  it("returns the same object when nothing is new", () => {
    const current = { dancers: ["a"], props: [], obstacles: [] };
    expect(addToSelection(current, { dancers: ["a"], props: [], obstacles: [] })).toBe(current);
  });
});
