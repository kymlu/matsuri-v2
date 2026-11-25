import { StageGeometry } from "../../models/choreo";
import { METER_PX } from "../consts/consts";
import { addToSelection, BoxSelectInput, idsInBox } from "./boxSelectHelper";

const geometry: StageGeometry = {
  stageWidth: 10, stageLength: 8, yAxis: "top-down",
  margin: { topMargin: 2, bottomMargin: 2, leftMargin: 2, rightMargin: 2 },
};
// Stage metres to stage px, as dancers are drawn.
const px = (x: number, y: number) => ({ x: (x + 2) * METER_PX, y: (y + 2) * METER_PX });

const base: BoxSelectInput = {
  geometry,
  dancerPositions: [
    { dancerId: "a", x: 1, y: 1, color: "#f00", sectionId: "s", type: "dancer" as const },
    { dancerId: "b", x: 3, y: 1, color: "#f00", sectionId: "s", type: "dancer" as const },
    { dancerId: "c", x: 8, y: 6, color: "#f00", sectionId: "s", type: "dancer" as const },
  ],
  propPositions: [{ propId: "p", x: 1, y: 3, sectionId: "s", type: "prop" }],
  props: { p: { id: "p", name: "旗", width: 2, length: 1, color: "#00f" } as any },
  obstacles: [{ id: "o", name: "台", x: 6, y: 1, width: 1, length: 1, color: "#888" } as any],
  canSelectDancers: true,
  canSelectProps: true,
  canSelectObstacles: true,
};

describe("idsInBox", () => {
  it("catches dancers whose centre is inside, whichever corner the drag started from", () => {
    const r1 = idsInBox(px(0, 0), px(4, 2), base);
    const r2 = idsInBox(px(4, 2), px(0, 0), base);
    expect(r1.dancers).toEqual(["a", "b"]);
    expect(r2.dancers).toEqual(["a", "b"]);
  });

  it("uses a prop's centre, not its corner", () => {
    // Prop corner is at (1,3); its centre is (2,3.5).
    expect(idsInBox(px(0.5, 2.5), px(1.5, 3.2), base).props).toEqual([]);
    expect(idsInBox(px(1.5, 3), px(2.5, 4), base).props).toEqual(["p"]);
  });

  it("skips kinds that can't be selected and excluded dancers", () => {
    const r = idsInBox(px(0, 0), px(10, 8), { ...base, canSelectObstacles: false, canSelectProps: false, excludedDancerIds: new Set(["b"]) });
    expect(r).toEqual({ dancers: ["a", "c"], props: [], obstacles: [] });
  });

  it("catches unlocked obstacles", () => {
    expect(idsInBox(px(6, 1), px(7, 2), base).obstacles).toEqual(["o"]);
  });

  it("works when y counts from the back", () => {
    const bottomUp = { ...base, geometry: { ...geometry, yAxis: "bottom-up" as const } };
    // y=1 from the back of an 8m stage is 7m from the front edge in px terms.
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
