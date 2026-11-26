import { addToSelection, BoxSelectInput, idsInBox } from "./boxSelectHelper";

// Dancers are 20px circles; "p" is a 50x25 prop; "o" a 25px obstacle.
const bounds: Record<string, { x: number, y: number, width: number, height: number }> = {
  a: { x: 40, y: 40, width: 20, height: 20 },
  b: { x: 90, y: 40, width: 20, height: 20 },
  c: { x: 240, y: 190, width: 20, height: 20 },
  p: { x: 75, y: 125, width: 50, height: 25 },
  o: { x: 200, y: 50, width: 25, height: 25 },
};

const base: BoxSelectInput = {
  dancerIds: ["a", "b", "c"],
  propIds: ["p"],
  obstacleIds: ["o"],
  boundsOf: id => bounds[id],
  canSelectDancers: true,
  canSelectProps: true,
  canSelectObstacles: true,
};

describe("idsInBox", () => {
  it("catches what is wholly inside, whichever corner the drag started from", () => {
    expect(idsInBox({ x: 30, y: 30 }, { x: 120, y: 70 }, base).dancers).toEqual(["a", "b"]);
    expect(idsInBox({ x: 120, y: 70 }, { x: 30, y: 30 }, base).dancers).toEqual(["a", "b"]);
  });

  it("leaves out anything the box only partly covers, dancers included", () => {
    // Covers a's centre but clips its right edge; covers the prop's centre but not its right end.
    expect(idsInBox({ x: 30, y: 30 }, { x: 55, y: 70 }, base).dancers).toEqual([]);
    expect(idsInBox({ x: 70, y: 120 }, { x: 115, y: 160 }, base).props).toEqual([]);
    expect(idsInBox({ x: 70, y: 120 }, { x: 130, y: 160 }, base).props).toEqual(["p"]);
  });

  it("catches obstacles when they can be selected", () => {
    expect(idsInBox({ x: 195, y: 45 }, { x: 230, y: 80 }, base).obstacles).toEqual(["o"]);
    expect(idsInBox({ x: 195, y: 45 }, { x: 230, y: 80 }, { ...base, canSelectObstacles: false }).obstacles).toEqual([]);
  });

  it("skips kinds that can't be selected and excluded dancers", () => {
    const r = idsInBox({ x: 0, y: 0 }, { x: 300, y: 300 }, { ...base, canSelectProps: false, excludedDancerIds: new Set(["b"]) });
    expect(r).toEqual({ dancers: ["a", "c"], props: [], obstacles: ["o"] });
  });

  it("skips anything not drawn", () => {
    expect(idsInBox({ x: 0, y: 0 }, { x: 300, y: 300 }, { ...base, boundsOf: () => undefined }))
      .toEqual({ dancers: [], props: [], obstacles: [] });
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
