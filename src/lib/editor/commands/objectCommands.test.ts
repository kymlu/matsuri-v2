import { Choreo } from "../../../models/choreo";
import { editAndDeleteProps, updateObstacleSizeAndRotate, updatePropSizeAndRotate } from "./objectCommands";

// Undo works by going back to an earlier state object, so a command must never change the state it's given.
function makeChoreo(): Choreo {
  return {
    id: "c1",
    name: "隊列",
    event: "祭り",
    stageType: "stage",
    stageGeometry: {
      stageWidth: 10,
      stageLength: 8,
      margin: { topMargin: 1, bottomMargin: 1, leftMargin: 1, rightMargin: 1 },
      yAxis: "top-down",
    },
    sections: [{
      id: "s1",
      name: "サビ1",
      order: 1,
      formation: {
        dancerPositions: {},
        dancerActions: [],
        propPositions: { p1: { propId: "p1", x: 2, y: 2, sectionId: "s1", type: "prop" } },
      },
    }],
    dancers: {},
    props: { p1: { id: "p1", name: "大旗", width: 4, length: 1, color: "#F08A00" } },
    obstacles: { o1: { id: "o1", name: "柱", width: 1, length: 1, color: "#000000", x: 0, y: 0, rotation: 0, sectionId: "s1", type: "obstacle" } },
  } as Choreo;
}

describe("prop and obstacle resizing", () => {
  it("resizing a prop by hand leaves the previous state as it was", () => {
    const before = makeChoreo();
    const after = updatePropSizeAndRotate(before, "s1", 2, 3, 90, 4, 5, "p1");
    expect(after.props.p1).toMatchObject({ width: 2, length: 3 });
    expect(after.sections[0].formation.propPositions.p1).toMatchObject({ x: 4, y: 5, rotation: 90 });
    expect(before.props.p1).toMatchObject({ width: 4, length: 1 });
    expect(after.props.p1).not.toBe(before.props.p1);
  });

  it("resizing an obstacle by hand leaves the previous state as it was", () => {
    const before = makeChoreo();
    const after = updateObstacleSizeAndRotate(before, 3, 2, 45, 6, 7, "o1");
    expect(after.obstacles!.o1).toMatchObject({ width: 3, length: 2, rotation: 45, x: 6, y: 7 });
    expect(before.obstacles!.o1).toMatchObject({ width: 1, length: 1, rotation: 0, x: 0, y: 0 });
  });

  it("renaming a prop with its 名簿 size and colour leaves the previous state as it was", () => {
    const before = makeChoreo();
    const after = editAndDeleteProps(before, { ...before.props, p1: { ...before.props.p1, name: "中旗", width: 2, length: 1, color: "#5CB85C" } }, new Set());
    expect(after.props.p1).toMatchObject({ name: "中旗", width: 2, color: "#5CB85C" });
    expect(before.props.p1).toMatchObject({ name: "大旗", width: 4, color: "#F08A00" });
    expect(before.sections[0].formation.propPositions.p1).toMatchObject({ x: 2, y: 2 });
  });
});
