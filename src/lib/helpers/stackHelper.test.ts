import { Choreo } from "../../models/choreo";
import { countUnits, expandSelectionToStacks, findDropTarget, stackNotes, isHiddenInStack, normalizeStacks, reorderStack, selectedWholeStack, stackAbove, stackBelow, stackObjects, unstackObjects } from "./stackHelper";
import { removeObjects } from "../editor/commands/objectCommands";
import { addSection } from "../editor/commands/sectionCommands";

const dp = (id: string, x: number, y: number, z: number) => ({ dancerId: id, x, y, z, color: "#000", sectionId: "s1", type: "dancer" as const });

function makeChoreo(): Choreo {
  return {
    id: "c1", name: "隊列", event: "祭り", stageType: "stage",
    stageGeometry: { stageWidth: 10, stageLength: 8, margin: { topMargin: 1, bottomMargin: 1, leftMargin: 1, rightMargin: 1 }, yAxis: "top-down" },
    sections: [{
      id: "s1", name: "サビ", order: 1,
      formation: {
        dancerPositions: { a: dp("a", 1, 1, 0), b: dp("b", 3, 1, 1), c: dp("c", 5, 1, 2), d: dp("d", 7, 1, 3) },
        dancerActions: [],
        propPositions: {
          p: { propId: "p", x: 0, y: 4, z: 0, sectionId: "s1", type: "prop" },
          q: { propId: "q", x: 6, y: 4, z: 1, sectionId: "s1", type: "prop" },
        },
      },
    }],
    dancers: { a: { id: "a", name: "花子" }, b: { id: "b", name: "一郎" }, c: { id: "c", name: "松子" }, d: { id: "d", name: "月子" } },
    props: { p: { id: "p", name: "台", width: 4, length: 2, color: "#000" }, q: { id: "q", name: "箱", width: 2, length: 1, color: "#000" } },
    obstacles: {},
  } as Choreo;
}
const f = (s: Choreo) => s.sections[0].formation;
const pos = (s: Choreo, id: string) => f(s).dancerPositions[id];

describe("stackObjects", () => {
  it("stacks top-first ids on the bottom one's spot, with consecutive z", () => {
    const before = makeChoreo();
    const after = stackObjects(before, "s1", "dancers", ["a", "c"]);
    expect(f(after).dancerStacks).toEqual([["c", "a"]]);
    expect(pos(after, "a")).toMatchObject({ x: 5, y: 1 });
    expect(pos(after, "c")).toMatchObject({ x: 5, y: 1 });
    expect(pos(after, "a").z).toBe(pos(after, "c").z! + 1);
    expect(pos(before, "a")).toMatchObject({ x: 1, y: 1 }); // the old state is untouched, for undo
  });

  it("can stack in the middle of everyone", () => {
    const after = stackObjects(makeChoreo(), "s1", "dancers", ["a", "c"], "middle");
    expect(pos(after, "a")).toMatchObject({ x: 3, y: 1 });
    expect(pos(after, "c")).toMatchObject({ x: 3, y: 1 });
  });

  it("flattens existing stacks into one", () => {
    let s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]);
    s = stackObjects(s, "s1", "dancers", ["c", "d"]);
    s = stackObjects(s, "s1", "dancers", ["a", "b", "c", "d"]);
    expect(f(s).dancerStacks).toEqual([["d", "c", "b", "a"]]);
  });

  it("centres a prop on the prop below", () => {
    const after = stackObjects(makeChoreo(), "s1", "props", ["q", "p"]);
    expect(f(after).propPositions.q).toMatchObject({ x: 1, y: 4.5 });
  });

  it("ignores fewer than two", () => {
    const before = makeChoreo();
    expect(stackObjects(before, "s1", "dancers", ["a"])).toBe(before);
  });
});

describe("unstacking and reordering", () => {
  const three = () => stackObjects(makeChoreo(), "s1", "dancers", ["a", "b", "c"]); // c bottom, b, a top

  it("takes people out; they stay in place", () => {
    const s = unstackObjects(three(), "s1", "dancers", ["b"]);
    expect(f(s).dancerStacks).toEqual([["c", "a"]]);
    expect(pos(s, "b")).toMatchObject({ x: 5, y: 1 });
  });

  it("ends a stack left with one", () => {
    const s = unstackObjects(three(), "s1", "dancers", ["a", "b"]);
    expect(f(s).dancerStacks).toBeUndefined();
  });

  it("reorders without moving the stack", () => {
    const s = reorderStack(three(), "s1", "dancers", ["c", "a", "b"]);
    expect(f(s).dancerStacks).toEqual([["b", "a", "c"]]);
    ["a", "b", "c"].forEach(id => expect(pos(s, id)).toMatchObject({ x: 5, y: 1 }));
    expect(pos(s, "c").z).toBeGreaterThan(pos(s, "a").z!);
  });

  it("knows who is above, below and hidden", () => {
    const s = three();
    expect(stackBelow(f(s), "dancers", "a")).toBe("b");
    expect(stackAbove(f(s), "dancers", "c")).toBe("b");
    expect(isHiddenInStack(f(s), "dancers", "c")).toBe(true);
    expect(isHiddenInStack(f(s), "dancers", "a")).toBe(false);
  });
});

describe("normalizeStacks", () => {
  it("returns the same object when there are no stacks", () => {
    const s = makeChoreo();
    expect(normalizeStacks(s)).toBe(s);
  });

  it("snaps members back when one is moved alone", () => {
    const s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "c"]);
    const moved = { ...s, sections: [{ ...s.sections[0], formation: { ...f(s), dancerPositions: { ...f(s).dancerPositions, a: { ...pos(s, "a"), x: 9 } } } }] };
    expect(pos(normalizeStacks(moved), "a")).toMatchObject({ x: 5 });
  });

  it("deleting the middle person drops the one above onto the one below", () => {
    const s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "b", "c"]);
    const after = normalizeStacks(removeObjects(s, { dancers: ["b"], props: [], obstacles: [] }));
    expect(f(after).dancerStacks).toEqual([["c", "a"]]);
  });

  it("keeps others' order when pulling a stack together", () => {
    const s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "c"]);
    const z = (id: string) => pos(s, id).z!;
    expect(z("b")).toBeLessThan(z("c"));
    expect(z("c")).toBeLessThan(z("a"));
    expect(z("a")).toBeLessThan(z("d"));
  });
});

describe("selection", () => {
  const s = () => stackObjects(makeChoreo(), "s1", "dancers", ["a", "c"]);
  const none = { dancers: [], props: [], obstacles: [] };

  it("a tap on one member selects the whole stack, and a second tap removes it", () => {
    const selected = expandSelectionToStacks(f(s()), none, { ...none, dancers: ["a"] });
    expect(selected.dancers.sort()).toEqual(["a", "c"]);
    expect(expandSelectionToStacks(f(s()), selected, { ...selected, dancers: ["c"] }).dancers).toEqual([]);
  });

  it("counts a stack as one", () => {
    expect(countUnits(f(s()), "dancers", ["a", "c", "b"])).toBe(2);
    expect(selectedWholeStack(f(s()), "dancers", ["c", "a"])).toEqual(["c", "a"]);
    expect(selectedWholeStack(f(s()), "dancers", ["c", "a", "b"])).toBeUndefined();
  });
});

describe("findDropTarget", () => {
  const near = () => {
    const s = makeChoreo();
    return { ...s, sections: [{ ...s.sections[0], formation: { ...f(s), dancerPositions: { ...f(s).dancerPositions, a: dp("a", 3.1, 1.1, 0) } } }] };
  };

  it("finds the thing a single person was dropped onto", () => {
    expect(findDropTarget(f(near()), "dancers", ["a"], {})).toEqual(["b"]);
  });

  it("ignores things further than 0.2m and moves of several things", () => {
    expect(findDropTarget(f(makeChoreo()), "dancers", ["a"], {})).toBeUndefined();
    expect(findDropTarget(f(near()), "dancers", ["a", "d"], {})).toBeUndefined();
  });

  it("treats a dragged whole stack as one thing, and a target stack as a whole", () => {
    let s = stackObjects(makeChoreo(), "s1", "dancers", ["c", "d"]); // at d's spot (7,1)
    s = { ...s, sections: [{ ...s.sections[0], formation: { ...f(s), dancerPositions: { ...f(s).dancerPositions, a: dp("a", 7.05, 1, 0) } } }] };
    expect(findDropTarget(f(s), "dancers", ["a"], {})).toEqual(["d", "c"]);
  });
});

describe("stackNotes", () => {
  const names: Record<string, string> = { a: "花子", b: "一郎", c: "松子", d: "月子" };
  const name = (id: string) => names[id];

  it("says who is under or on top now, and getting off next", () => {
    const now = f(stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"])); // a on b
    const next = f(makeChoreo());
    expect(stackNotes(now, next, "a", name)).toEqual({ now: "一郎の上", next: "一郎から降りる" });
    expect(stackNotes(now, next, "b", name)).toEqual({ now: "花子を乗せている", next: "花子が降りる" });
  });

  it("says getting on next", () => {
    const now = f(makeChoreo());
    const next = f(stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]));
    expect(stackNotes(now, next, "a", name)).toEqual({ now: undefined, next: "一郎に乗る" });
  });

  it("says nothing when nothing changes", () => {
    expect(stackNotes(f(makeChoreo()), f(makeChoreo()), "a", name)).toEqual({ now: undefined, next: undefined });
  });
});

describe("sections", () => {
  it("a new section keeps the stacks (a duplicate copies the whole formation)", () => {
    const s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]);
    expect(addSection(s, "s2").sections[1].formation.dancerStacks).toEqual([["b", "a"]]);
  });
});
