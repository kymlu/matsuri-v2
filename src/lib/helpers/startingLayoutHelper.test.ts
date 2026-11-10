import { buildStartingLayout, getParadeWindow, OVERFLOW_OFFSET, placeDancers, placeProps } from "./startingLayoutHelper";

const stage = { stageWidth: 4, stageLength: 3 }; // 5 × 4 = 20 dancer spots

describe("placeDancers", () => {
  it("fills 1m grid points row by row from the front", () => {
    expect(placeDancers(7, stage)).toEqual([
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
      { x: 0, y: 1 }, { x: 1, y: 1 },
    ]);
  });

  it("starts again from the first spot, offset, once the stage is full", () => {
    const spots = placeDancers(22, stage);
    expect(spots[19]).toEqual({ x: 4, y: 3 });
    expect(spots[20]).toEqual({ x: OVERFLOW_OFFSET, y: OVERFLOW_OFFSET });
    expect(spots[21]).toEqual({ x: 1 + OVERFLOW_OFFSET, y: OVERFLOW_OFFSET });
  });
});

describe("placeProps", () => {
  const wide = { stageWidth: 10, stageLength: 8 };

  it("starts 1m behind the last row of dancers and packs rows with a gap", () => {
    // 6 dancers in one row (y = 0), so props start at y = 1.
    expect(placeProps([{ width: 4, length: 1 }, { width: 1, length: 1 }, { width: 4, length: 1 }], 6, { stageWidth: 8, stageLength: 8 })).toEqual([
      { x: 0, y: 1 }, { x: 4.5, y: 1 }, { x: 0, y: 2.5 },
    ]);
  });

  it("starts at the front when there are no dancers", () => {
    expect(placeProps([{ width: 1, length: 1 }], 0, wide)).toEqual([{ x: 0, y: 0 }]);
  });

  it("starts again from the first prop spot, offset, when they no longer fit", () => {
    // Two 4×2 props fit one behind the other on a 4×5 stage; the third goes back to the front, offset.
    const spots = placeProps(Array(3).fill({ width: 4, length: 2 }), 0, { stageWidth: 4, stageLength: 5 });
    expect(spots).toEqual([{ x: 0, y: 0 }, { x: 0, y: 2.5 }, { x: OVERFLOW_OFFSET, y: OVERFLOW_OFFSET }]);
  });

  it("goes back to the front when dancers fill the stage", () => {
    expect(placeProps([{ width: 1, length: 1 }], 20, stage)).toEqual([{ x: 0, y: 0 }]);
  });
});

describe("buildStartingLayout", () => {
  let n = 0;
  const newId = () => `id${n++}`;
  beforeEach(() => { n = 0; });

  it("places picked dancers first, then unnamed ones numbered from 1, then props", () => {
    const layout = buildStartingLayout(["さくら", "はると"], 2,
      [{ name: "大旗", width: 4, length: 1, color: "#F08A00" }], { stageWidth: 10, stageLength: 8 }, "s1", newId);
    expect(Object.values(layout.dancers).map(d => d.name)).toEqual(["さくら", "はると", "1", "2"]);
    expect(layout.dancerPositions.id0).toMatchObject({ x: 0, y: 0, sectionId: "s1", type: "dancer" });
    expect(layout.dancerPositions.id3).toMatchObject({ x: 3, y: 0 });
    expect(layout.props.id4).toEqual({ id: "id4", name: "大旗", width: 4, length: 1, color: "#F08A00" });
    expect(layout.propPositions.id4).toMatchObject({ x: 0, y: 1, propId: "id4", type: "prop" });
    expect(layout.depth).toBe(2);
  });
});

describe("getParadeWindow", () => {
  it("shows at least 10m, growing in 5m steps, never past the course", () => {
    expect(getParadeWindow(0, 60)).toBe(10);
    expect(getParadeWindow(8, 60)).toBe(10);
    expect(getParadeWindow(9, 60)).toBe(15);
    expect(getParadeWindow(59, 60)).toBe(60);
    expect(getParadeWindow(3, 8)).toBe(8);
  });
});
