import { Choreo } from "../../models/choreo";
import { arrangeRepresentatives, linkedStack, swapUnits, swapUnitPositions, copyStacks, countSelectedUnits, prepareStackPaste, rearrangeWithStacks, restoreCopiedStacks, countUnits, expandSelectionToStacks, findDropTarget, moveStacksTogether, stackNotes, isHiddenInStack, normalizeStacks, reorderStack, selectedWholeStack, stackAbove, stackBelow, stackObjects, unstackObjects } from "./stackHelper";
import { alignHorizontalPositions, pastePositions, removeObjects } from "../editor/commands/objectCommands";
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
    expect(stackNotes(now, next, "b", name)).toEqual({ now: "花子の下", next: "花子が降りる" });
  });

  it("says getting on next", () => {
    const now = f(makeChoreo());
    const next = f(stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]));
    expect(stackNotes(now, next, "a", name)).toEqual({ now: undefined, next: "一郎に乗る" });
  });

  it("in a stack of three, the middle one says who they're on", () => {
    const now = f(stackObjects(makeChoreo(), "s1", "dancers", ["a", "b", "c"])); // a on b on c
    expect(stackNotes(now, f(makeChoreo()), "b", name).now).toBe("松子の上");
    // Only the top one gets off next: the middle one still stands on 松子, so nothing about above.
    const next = f(stackObjects(makeChoreo(), "s1", "dancers", ["b", "c"]));
    expect(stackNotes(now, next, "b", name).next).toBeUndefined();
    expect(stackNotes(now, next, "c", name).next).toBeUndefined();
    expect(stackNotes(now, next, "a", name).next).toBe("一郎から降りる");
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

describe("moveStacksTogether", () => {
  it("brings the rest of a stack by the same amount", () => {
    const s = f(stackObjects(makeChoreo(), "s1", "dancers", ["a", "c"])); // both at (5,1)
    const moves = { dancers: { a: { x: 6, y: 2 } }, props: {}, obstacles: {} };
    expect(moveStacksTogether(s, moves).dancers).toEqual({ a: { x: 6, y: 2 }, c: { x: 6, y: 2 } });
  });

  it("leaves moves alone when nobody is stacked", () => {
    const moves = { dancers: { a: { x: 6, y: 2 } }, props: {}, obstacles: {} };
    expect(moveStacksTogether(f(makeChoreo()), moves)).toBe(moves);
  });
});

describe("整理 with stacks", () => {
  const ab = () => stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]); // b bottom at (3,1), a on top
  const all = { dancers: ["a", "b"], props: [], obstacles: [] };

  it("counts a stack once and moves only its lowest selected member", () => {
    const s = ab();
    expect(countSelectedUnits(f(s), all)).toBe(1);
    const reps = arrangeRepresentatives(f(s), { dancers: [pos(s, "a"), pos(s, "b")], props: [], obstacles: [] });
    expect(reps.dancers.map(d => d.dancerId)).toEqual(["b"]);
  });

  it("aligns a single stack to the stage, everyone together", () => {
    const s = ab();
    const reps = arrangeRepresentatives(f(s), { dancers: [pos(s, "a"), pos(s, "b")], props: [], obstacles: [] });
    const after = normalizeStacks(alignHorizontalPositions(s, "s1", reps, "left"));
    expect(pos(after, "a").x).toBe(0);
    expect(pos(after, "b").x).toBe(0);
  });

  it("moves a stack back past a whole other stack, keeping both together", () => {
    let s = stackObjects(makeChoreo(), "s1", "dancers", ["c", "d"]); // d bottom, c top: the front-most pair
    s = ab(); s = stackObjects(s, "s1", "dancers", ["c", "d"]);
    const order = () => Object.values(f(s).dancerPositions).sort((x, y) => x.z! - y.z!).map(d => d.dancerId);
    s = rearrangeWithStacks(s, "s1", { dancers: ["c", "d"], props: [], obstacles: [] }, "backward");
    expect(order()).toEqual(["d", "c", "b", "a"]);
    s = rearrangeWithStacks(s, "s1", { dancers: ["d", "c"], props: [], obstacles: [] }, "forward");
    expect(order()).toEqual(["b", "a", "d", "c"]);
    s = rearrangeWithStacks(s, "s1", { dancers: ["a", "b"], props: [], obstacles: [] }, "toFront");
    expect(order()).toEqual(["d", "c", "b", "a"]);
  });
});

describe("copy and paste with stacks", () => {
  const withSecond = (s: Choreo): Choreo => ({ ...s, sections: [...s.sections, { ...s.sections[0], id: "s2", formation: { ...makeChoreo().sections[0].formation } }] });
  const f2 = (s: Choreo) => s.sections[1].formation;
  const paste = (s: Choreo, ids: string[]) => {
    const buffer = { dancers: Object.fromEntries(ids.map(id => [id, f(s).dancerPositions[id]])), props: {}, obstacles: {} };
    const copied = copyStacks(f(s), { dancers: ids, props: [], obstacles: [] });
    const prepared = prepareStackPaste(s, "s2", { dancers: ids, props: [] }, copied);
    return { state: normalizeStacks(restoreCopiedStacks(pastePositions(prepared.state, "s2", buffer), "s2", copied)), left: prepared.leftStack };
  };

  it("pastes a whole stack as a stack", () => {
    const { state } = paste(withSecond(stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"])), ["a", "b"]);
    expect(f2(state).dancerStacks).toEqual([["b", "a"]]);
    expect(f2(state).dancerPositions.a).toMatchObject({ x: 3, y: 1 });
  });

  it("takes a pasted person out of a stack in the target instead of snapping back", () => {
    let s = withSecond(makeChoreo());
    s = stackObjects(s, "s2", "dancers", ["a", "c"]); // in s2, a sits on c at (5,1)
    const { state, left } = paste(s, ["a"]);
    expect(f2(state).dancerPositions.a).toMatchObject({ x: 1, y: 1 });
    expect(f2(state).dancerPositions.c).toMatchObject({ x: 5, y: 1 });
    expect(f2(state).dancerStacks).toBeUndefined();
    expect(left.dancers).toEqual(["a"]);
  });

  it("a partly copied stack pastes as separate people", () => {
    const s = withSecond(stackObjects(makeChoreo(), "s1", "dancers", ["a", "b", "c"]));
    expect(copyStacks(f(s), { dancers: ["a", "b"], props: [], obstacles: [] }).dancers).toEqual([]);
  });
});

describe("位置交換 with stacks", () => {
  it("finds two units, not one stack", () => {
    const s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]);
    expect(swapUnits(f(s), "dancers", ["a", "b"])).toBeUndefined();
    expect(swapUnits(f(s), "dancers", ["a", "b", "c"])).toEqual([["b", "a"], ["c"]]);
  });

  it("swaps a stack with a person, keeping the stack", () => {
    let s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]); // at b (3,1)
    s = normalizeStacks(swapUnitPositions(s, "s1", "dancers", ["b", "a"], ["c"])); // c at (5,1)
    expect(pos(s, "a")).toMatchObject({ x: 5, y: 1 });
    expect(pos(s, "b")).toMatchObject({ x: 5, y: 1 });
    expect(pos(s, "c")).toMatchObject({ x: 3, y: 1 });
    expect(f(s).dancerStacks).toEqual([["b", "a"]]);
  });

  it("swaps two stacks", () => {
    let s = stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"]); // at (3,1)
    s = stackObjects(s, "s1", "dancers", ["c", "d"]); // d bottom
    const dAt = { x: pos(s, "d").x, y: pos(s, "d").y };
    s = normalizeStacks(swapUnitPositions(s, "s1", "dancers", ["b", "a"], ["d", "c"]));
    expect(pos(s, "a")).toMatchObject(dAt);
    expect(pos(s, "c")).toMatchObject({ x: 3, y: 1 });
  });
});

describe("linked stack paths", () => {
  const twoSections = (s: Choreo): Choreo => ({ ...s, sections: [s.sections[0], { ...s.sections[0], id: "s2", formation: { ...s.sections[0].formation } }] });
  const path = { points: [{ x: 9, y: 9 }], tension: "curved" as const };

  it("a stack that stays together shares the bottom member's path", () => {
    let s = twoSections(stackObjects(makeChoreo(), "s1", "dancers", ["a", "b"])); // b bottom in both
    expect(linkedStack(s.sections[0].formation, s.sections[1].formation, "dancers", "a")).toEqual(["b", "a"]);
    s = { ...s, sections: [s.sections[0], { ...s.sections[1], formation: { ...s.sections[1].formation, dancerMovements: { b: path, a: { points: [], tension: "straight" } } } }] };
    s = normalizeStacks(s);
    expect(s.sections[1].formation.dancerMovements?.a).toEqual(path);
  });

  it("a stack that just formed keeps separate paths", () => {
    let s = makeChoreo();
    s = { ...s, sections: [s.sections[0], { ...s.sections[0], id: "s2" }] };
    s = stackObjects(s, "s2", "dancers", ["a", "b"]);
    expect(linkedStack(s.sections[0].formation, s.sections[1].formation, "dancers", "a")).toBeUndefined();
    const other = { points: [{ x: 1, y: 1 }], tension: "curved" as const };
    s = { ...s, sections: [s.sections[0], { ...s.sections[1], formation: { ...s.sections[1].formation, dancerMovements: { b: path, a: other } } }] };
    expect(normalizeStacks(s).sections[1].formation.dancerMovements?.a).toEqual(other);
  });
});
