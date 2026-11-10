import { Choreo } from "../../../models/choreo";
import { addSection, duplicateSection } from "./sectionCommands";
import { randomUUID } from "crypto";

// jsdom has no crypto.randomUUID.
beforeAll(() => {
  if (!globalThis.crypto?.randomUUID) {
    Object.defineProperty(globalThis, "crypto", { value: { ...globalThis.crypto, randomUUID }, configurable: true });
  }
});

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
      name: "サビ(1)",
      formation: {
        dancerPositions: { d1: { dancerId: "d1", x: 1, y: 1, sectionId: "s1", type: "dancer", color: "#000000" } },
        propPositions: { p1: { propId: "p1", x: 2, y: 2, sectionId: "s1", type: "prop" } },
        dancerMovements: { d1: { points: [{ x: 3, y: 3 }], tension: "curved" } },
        dancerActions: [{ id: "a1", name: "ジャンプ", timings: [{ id: "t1", name: "1", dancerIds: ["d1"] }] }],
      },
    }],
    dancers: { d1: { id: "d1", name: "さくら" } },
    props: { p1: { id: "p1", name: "大旗", width: 4, length: 1, color: "#F08A00" } },
  } as Choreo;
}

describe("addSection", () => {
  it("copies the last section's positions for the new section without changing the last section", () => {
    const before = makeChoreo();
    const after = addSection(before, "s2");
    const added = after.sections[1];
    expect(added).toMatchObject({ id: "s2", name: "サビ(2)" });
    expect(added.formation.dancerPositions.d1).toMatchObject({ x: 1, y: 1, sectionId: "s2" });
    expect(added.formation.propPositions.p1).toMatchObject({ x: 2, y: 2, sectionId: "s2" });
    expect(added.formation.dancerActions).toEqual([]);
    expect(before.sections[0].formation.dancerPositions.d1.sectionId).toBe("s1");
    expect(added.formation.dancerPositions.d1).not.toBe(before.sections[0].formation.dancerPositions.d1);
  });
});

describe("duplicateSection", () => {
  it("makes a full copy that shares nothing with the original", () => {
    const before = makeChoreo();
    const after = duplicateSection(before, before.sections[0], 0);
    const [copy, original] = after.sections;
    expect(original).toBe(before.sections[0]);
    expect(before.sections[0].formation.dancerPositions.d1.sectionId).toBe("s1");

    expect(copy.id).not.toBe("s1");
    expect(copy.formation.dancerPositions.d1).toMatchObject({ x: 1, y: 1, sectionId: copy.id });
    expect(copy.formation.propPositions.p1.sectionId).toBe(copy.id);
    expect(copy.formation.dancerMovements!.d1.points).toEqual([{ x: 3, y: 3 }]);
    expect(copy.formation.dancerMovements!.d1.points[0]).not.toBe(original.formation.dancerMovements!.d1.points[0]);

    const [copyAction] = copy.formation.dancerActions;
    expect(copyAction).toMatchObject({ name: "ジャンプ", timings: [{ name: "1", dancerIds: ["d1"] }] });
    expect(copyAction.id).not.toBe("a1");
    expect(copyAction.timings[0].id).not.toBe("t1");
    expect(copyAction.timings[0].dancerIds).not.toBe(original.formation.dancerActions[0].timings[0].dancerIds);
  });
});
