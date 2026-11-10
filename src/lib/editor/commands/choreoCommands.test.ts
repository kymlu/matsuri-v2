import { Choreo, StageGeometry } from "../../../models/choreo";
import { getAnchorRange } from "../../helpers/editorCalculationHelper";
import { changeStageGeometryAndType, getObjectsOutsideStage } from "./choreoCommands";
import { editAndDeleteProps } from "./objectCommands";

// A 10m × 8m stage with 1m margins: anchors can be at x -1 to 11 and y -1 to 9.
// さくら is on stage, あおい is in the back-right margin.
function makeChoreo(): Choreo {
  return {
    id: "c1",
    name: "隊列",
    event: "祭り",
    stageType: "stage",
    stageGeometry: geometry({}),
    sections: [{
      id: "s1",
      name: "サビ1",
      formation: {
        dancerPositions: {
          d1: { dancerId: "d1", x: 1, y: 1, sectionId: "s1", type: "dancer", color: "#000000" },
          d2: { dancerId: "d2", x: 10.5, y: 8.5, sectionId: "s1", type: "dancer", color: "#000000" },
        },
        dancerMovements: { d1: { points: [{ x: 9, y: 2 }], tension: "curved" } },
        dancerActions: [],
        propPositions: { p1: { propId: "p1", x: 5, y: 2, sectionId: "s1", type: "prop", inUse: true } },
        propMovements: { p1: { points: [{ x: 4, y: 3 }], tension: "straight" } },
      },
    }, {
      id: "s2",
      name: "サビ2",
      formation: {
        dancerPositions: {
          d1: { dancerId: "d1", x: 5, y: 4, sectionId: "s2", type: "dancer", color: "#000000" },
          d2: { dancerId: "d2", x: 9, y: 4, sectionId: "s2", type: "dancer", color: "#000000" },
        },
        dancerActions: [],
        propPositions: {},
      },
    }],
    dancers: { d1: { id: "d1", name: "さくら" }, d2: { id: "d2", name: "あおい" } },
    props: { p1: { id: "p1", name: "旗", color: "#000000", length: 1, width: 1 } },
    obstacles: { o1: { id: "o1", name: "柱", x: 0, y: 0, sectionId: "", type: "obstacle", color: "#000000", length: 1, width: 1 } },
  };
}

function geometry({ width = 10, length = 8, margin = 1, yAxis = "top-down" }: { width?: number, length?: number, margin?: number, yAxis?: StageGeometry["yAxis"] }): StageGeometry {
  return {
    stageWidth: width,
    stageLength: length,
    margin: { topMargin: margin, bottomMargin: margin, leftMargin: margin, rightMargin: margin },
    yAxis,
  };
}

const resize = (newGeometry: StageGeometry) => changeStageGeometryAndType(makeChoreo(), newGeometry, "stage");
const dancer = (choreo: Choreo, sectionIndex: number, id: string) => {
  const { x, y } = choreo.sections[sectionIndex].formation.dancerPositions[id];
  return { x, y };
};

describe("changeStageGeometryAndType", () => {
  it("moves nothing when the size doesn't change", () => {
    const choreo = makeChoreo();
    expect(changeStageGeometryAndType(choreo, geometry({}), "stage")).toEqual(choreo);
  });

  it("keeps everything centred when the stage gets wider", () => {
    const result = resize(geometry({ width: 12 }));
    expect(result.stageGeometry.stageWidth).toBe(12);
    expect(dancer(result, 0, "d1")).toEqual({ x: 2, y: 1 });
    expect(dancer(result, 0, "d2")).toEqual({ x: 11.5, y: 8.5 });
    expect(dancer(result, 1, "d1")).toEqual({ x: 6, y: 4 });
    expect(result.sections[0].formation.propPositions.p1).toMatchObject({ x: 6, y: 2, inUse: true });
    expect(result.obstacles?.o1).toMatchObject({ x: 1, y: 0 });
    expect(result.sections[0].formation.dancerMovements?.d1).toEqual({ points: [{ x: 10, y: 2 }], tension: "curved" });
    expect(result.sections[0].formation.propMovements?.p1).toEqual({ points: [{ x: 5, y: 3 }], tension: "straight" });
  });

  it("moves anything outside a narrower stage to the side edge", () => {
    // Shifted 1m left: あおい goes from 10.5 to 9.5, past the new limit of 9.
    const result = resize(geometry({ width: 8 }));
    expect(dancer(result, 0, "d1")).toEqual({ x: 0, y: 1 });
    expect(dancer(result, 0, "d2")).toEqual({ x: 9, y: 8.5 });
    expect(result.obstacles?.o1).toMatchObject({ x: -1, y: 0 });
  });

  it("keeps y measured from the front, and moves anything past a shorter stage to the back edge", () => {
    const result = resize(geometry({ length: 6 }));
    expect(dancer(result, 0, "d1")).toEqual({ x: 1, y: 1 });
    expect(dancer(result, 0, "d2")).toEqual({ x: 10.5, y: 7 });
  });

  it("moves anything outside smaller margins to the edge", () => {
    const result = resize(geometry({ margin: 0.25 }));
    expect(dancer(result, 0, "d2")).toEqual({ x: 10.25, y: 8.25 });
  });

  it("moves path midpoints to the edge too", () => {
    const result = resize(geometry({ width: 4 }));
    // Shifted 3m left to 6, past the new limit of 5.
    expect(result.sections[0].formation.dancerMovements?.d1.points).toEqual([{ x: 5, y: 2 }]);
  });
});

describe("changeStageGeometryAndType with props and obstacles", () => {
  const prop = (choreo: Choreo) => choreo.sections[0].formation.propPositions.p1;
  const withProp = (x: number, y: number, rotation?: number) => {
    const choreo = makeChoreo();
    Object.assign(prop(choreo), { x, y, rotation });
    return choreo;
  };

  it("keeps all of the object inside, not just its corner", () => {
    // Shifted 3m left to 7. The 1m-wide prop's corner can go up to 4, where a dancer's could go to 5.
    const result = changeStageGeometryAndType(withProp(10, 2), geometry({ width: 4 }), "stage");
    expect(prop(result)).toMatchObject({ x: 4, y: 2 });
  });

  it("uses the rotated size", () => {
    // Turned 90° around its corner, the prop reaches 1m to the left of it.
    const result = changeStageGeometryAndType(withProp(0, 2, 90), geometry({ margin: 0.5 }), "stage");
    expect(prop(result)).toMatchObject({ x: 0.5, y: 2 });
  });

  it("measures the rotated size from the front for each direction", () => {
    // Turned 180°, the prop reaches 1m above its corner on screen. Bottom-up y is measured to its far edge.
    const topDown = changeStageGeometryAndType(withProp(5, -1.5, 180), geometry({}), "stage");
    expect(prop(topDown).y).toBe(0);
    const bottomUp = changeStageGeometryAndType({ ...withProp(5, -1.5, 180), stageGeometry: geometry({ yAxis: "bottom-up" }) }, geometry({ yAxis: "bottom-up" }), "stage");
    expect(prop(bottomUp).y).toBe(-1.5);
  });

  it("centres an object too big for the stage", () => {
    const choreo = makeChoreo();
    choreo.obstacles!.o1.width = 14;
    // The stage plus margins is 12m wide, so it sticks out 1m on each side.
    expect(changeStageGeometryAndType(choreo, geometry({}), "stage").obstacles?.o1.x).toBe(-2);
  });

  it("leaves an object a rounding error past the edge where it is", () => {
    // Dragging saves positions from canvas pixels, so a rotated prop at the edge can be a hair past it.
    const { maxX } = getAnchorRange(geometry({}), 45, 1, 1);
    const choreo = withProp(maxX + 1e-12, 2, 45);
    expect(getObjectsOutsideStage(choreo, geometry({})).propIds).toEqual([]);
    expect(prop(changeStageGeometryAndType(choreo, geometry({}), "stage")).x).toBe(maxX + 1e-12);
  });

  it("counts an object that only sticks out past the edge", () => {
    // The corner at 9.5 is inside, but the 1m-wide prop reaches 10.5, past the new limit of 10.25.
    expect(getObjectsOutsideStage(withProp(9.5, 2), geometry({ margin: 0.25 })).propIds).toEqual(["p1"]);
  });
});

describe("getObjectsOutsideStage", () => {
  it("finds nothing when the stage gets bigger", () => {
    expect(getObjectsOutsideStage(makeChoreo(), geometry({ width: 12, length: 10 })))
      .toEqual({ dancerIds: [], propIds: [], obstacleIds: [], sectionIds: [] });
  });

  it("lists each object and section once", () => {
    // Shifted 3m left: さくら (s1), あおい (s1 and s2) and the obstacle end up outside; the prop at 2 stays.
    expect(getObjectsOutsideStage(makeChoreo(), geometry({ width: 4 })))
      .toEqual({ dancerIds: ["d1", "d2"], propIds: [], obstacleIds: ["o1"], sectionIds: ["s1", "s2"] });
  });

  it("measures y margins from the front for each direction", () => {
    const choreo = makeChoreo();
    choreo.sections[0].formation.dancerPositions.d1.y = -2;
    const uneven = (yAxis: StageGeometry["yAxis"]) =>
      ({ ...geometry({ margin: 3, yAxis }), margin: { topMargin: 1, bottomMargin: 3, leftMargin: 3, rightMargin: 3 } });
    // Top-down measures from the top (1m margin); bottom-up from the bottom (3m margin).
    expect(getObjectsOutsideStage(choreo, uneven("top-down")).dancerIds).toEqual(["d1"]);
    expect(getObjectsOutsideStage(choreo, uneven("bottom-up")).dancerIds).toEqual([]);
  });
});

describe("editAndDeleteProps", () => {
  const propPosition = (choreo: Choreo) => choreo.sections[0].formation.propPositions.p1;

  it("moves a prop that grew past the stage edge back inside", () => {
    // The 1m × 1m 旗 sits at x 5; 8m wide on a 10m stage with 1m margins, it can start at x 3 at most.
    const state = makeChoreo();
    const grown = editAndDeleteProps(state, { p1: { ...state.props.p1, width: 8 } }, new Set());
    expect(propPosition(grown).x).toBe(3);
    expect(propPosition(grown).y).toBe(2);
  });

  it("leaves positions alone when only the name or colour changes", () => {
    const state = makeChoreo();
    const renamed = editAndDeleteProps(state, { p1: { ...state.props.p1, name: "大旗", color: "#FF0000" } }, new Set());
    expect(propPosition(renamed)).toBe(propPosition(state));
  });
});
