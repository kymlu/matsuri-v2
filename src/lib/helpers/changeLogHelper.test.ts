import { Choreo } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { DancerAction } from "../../models/dancerAction";
import { Obstacle } from "../../models/prop";
import SampleStage from "../samples/SampleStageFormation.json";
import SampleParade from "../samples/SampleParadeFormation.json";
import { buildChangeLog, hasShownChanges } from "./changeLogHelper";
import { changeStageGeometryAndType } from "../editor/commands/choreoCommands";

// Two sections (s1, s2), two dancers (d1, d2), one prop (p1). Each test edits a fresh copy.
function makeChoreo(): Choreo {
  const section = (id: string, name: string, y: number): ChoreoSection => ({
    id,
    name,
    note: "",
    formation: {
      dancerPositions: {
        d1: { dancerId: "d1", x: 1, y, sectionId: id, type: "dancer", color: "#000000" },
        d2: { dancerId: "d2", x: 3, y, sectionId: id, type: "dancer", color: "#000000" },
      },
      dancerActions: [],
      propPositions: {
        p1: { propId: "p1", x: 5, y, sectionId: id, type: "prop", inUse: false },
      },
    },
  });

  return {
    id: "c1",
    name: "隊列",
    event: "祭り",
    stageType: "stage",
    stageGeometry: {
      stageWidth: 10,
      stageLength: 8,
      margin: { topMargin: 1, leftMargin: 1, rightMargin: 1, bottomMargin: 1 },
      yAxis: "top-down",
    },
    sections: [section("s1", "サビ1", 1), section("s2", "サビ2", 2)],
    dancers: { d1: { id: "d1", name: "さくら" }, d2: { id: "d2", name: "あおい" } },
    props: { p1: { id: "p1", name: "旗", color: "#000000", length: 1, width: 1 } },
    obstacles: {},
  };
}

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function edit(change: (choreo: Choreo) => void): Choreo {
  const choreo = makeChoreo();
  change(choreo);
  return choreo;
}

const compare = (change: (choreo: Choreo) => void, oldChange?: (choreo: Choreo) => void) =>
  buildChangeLog(oldChange ? edit(oldChange) : makeChoreo(), edit(change));

const action = (id: string, name: string, timings: [string, string, string[]][]): DancerAction => ({
  id,
  name,
  timings: timings.map(([timingId, timingName, dancerIds]) => ({ id: timingId, name: timingName, dancerIds })),
});

const obstacle: Obstacle = { id: "o1", name: "柱", x: 1, y: 1, sectionId: "", type: "obstacle", color: "#000000", length: 1, width: 1, rotation: 0 };

const setActions = (choreo: Choreo, sectionIndex: number, ...actions: DancerAction[]) => {
  choreo.sections[sectionIndex].formation.dancerActions = actions;
};

const setPath = (choreo: Choreo, points: { x: number, y: number }[], tension?: "straight" | "curved") => {
  choreo.sections[1].formation.dancerMovements = { d1: tension ? { points, tension } : { points } as any };
};

const addSection = (choreo: Choreo, index: number, id: string, name: string) => {
  choreo.sections.splice(index, 0, { ...copy(choreo.sections[0]), id, name });
};

describe("buildChangeLog", () => {
  describe("no changes", () => {
    it.each([
      ["sample stage", SampleStage],
      ["sample parade", SampleParade],
    ])("finds nothing between identical copies of the %s", (_, sample) => {
      expect(hasShownChanges(buildChangeLog(sample as Choreo, copy(sample) as Choreo))).toBe(false);
    });

    it.each<[string, (c: Choreo) => void]>([
      ["choreo name", c => { c.name = "新しい名前"; }],
      ["section duration", c => { c.sections[0].duration = 30; }],
      ["section head", c => { c.sections[0].head = 4; }],
      ["dancer colour", c => { c.sections[0].formation.dancerPositions.d1.color = "#ffffff"; }],
      ["dancer rotation", c => { c.sections[0].formation.dancerPositions.d1.rotation = 90; }],
      ["dancer front/back order", c => { c.sections[0].formation.dancerPositions.d1.z = 5; }],
      ["prop colour", c => { c.props.p1.color = "#ffffff"; }],
      ["prop size", c => { c.props.p1.length = 3; }],
      ["stage margins", c => { c.stageGeometry.margin.topMargin = 3; }],
      ["whitespace in a dancer name", c => { c.dancers.d1.name = " さくら "; }],
      ["whitespace in a memo", c => { c.sections[0].note = "  "; }],
      ["blank vs missing dates", c => { c.startDate = ""; c.endDate = ""; }],
      ["a move under 0.1m", c => { c.sections[0].formation.dancerPositions.d1.x = 1.04; }],
    ])("ignores a change to the %s", (_, change) => {
      expect(hasShownChanges(compare(change))).toBe(false);
    });

    it("compares an old file with missing optional fields", () => {
      const old = makeChoreo();
      delete old.obstacles;
      delete old.sections[0].note;
      delete old.sections[0].formation.dancerMovements;
      delete old.sections[0].formation.propMovements;
      expect(hasShownChanges(buildChangeLog(old, makeChoreo()))).toBe(false);
    });
  });

  describe("event and stage", () => {
    it("reports an event name change", () => {
      expect(compare(c => { c.event = "秋祭り"; }).overall.event.name).toEqual(["祭り", "秋祭り"]);
    });

    it("reports a date change", () => {
      expect(compare(c => { c.startDate = "2026-11-02"; }).overall.event.dates).toEqual([
        { startDate: undefined, endDate: undefined },
        { startDate: "2026-11-02", endDate: undefined },
      ]);
    });

    it("reports only the size when a resize keeps everything centred", () => {
      const old = edit(c => {
        c.obstacles = { o1: obstacle };
        setPath(c, [{ x: 2, y: 1 }], "curved");
      });
      const log = buildChangeLog(old, changeStageGeometryAndType(old, { ...old.stageGeometry, stageWidth: 12 }, "stage"));
      expect(log.overall.stage?.map(x => x.stageWidth)).toEqual([10, 12]);
      expect(log.dancers).toEqual({});
      expect(log.overall.props.lines).toEqual([]);
      expect(log.overall.obstacles.lines).toEqual([]);
    });

    it("compares x from the stage centre, so the same stored x on a wider stage is a move", () => {
      const log = compare(c => {
        c.stageGeometry.stageWidth = 12;
        c.obstacles = { o1: obstacle };
      }, c => { c.obstacles = { o1: obstacle }; });
      expect(log.dancers.d1).toMatchObject({ kind: "changed", sections: [{ sectionId: "s1" }, { sectionId: "s2" }] });
      expect(log.overall.props.lines).toEqual([{ name: "旗", moved: ["s1", "s2"], nowInUse: [], nowUnused: [] }]);
      expect(log.overall.obstacles.lines).toEqual([{ name: "柱", fields: ["position"] }]);
    });

    it("compares path midpoints from the stage centre", () => {
      const log = compare(c => {
        c.stageGeometry.stageWidth = 12;
        c.sections.forEach(section => Object.values(section.formation.dancerPositions).forEach(p => { p.x += 1; }));
        setPath(c, [{ x: 2, y: 1 }], "curved");
      }, c => setPath(c, [{ x: 2, y: 1 }], "curved"));
      expect(log.dancers.d1).toEqual({ kind: "changed", sections: [expect.objectContaining({ sectionId: "s1", pathChanged: true })] });
    });
  });

  describe("dancer positions", () => {
    it("reports a move of 0.1m or more with old and new positions", () => {
      const log = compare(c => { c.sections[0].formation.dancerPositions.d1.x = 1.1; });
      expect(log.dancers.d1).toEqual({
        kind: "changed",
        sections: [expect.objectContaining({
          sectionId: "s1",
          isNew: false,
          position: { from: expect.objectContaining({ x: 1, y: 1 }), to: expect.objectContaining({ x: 1.1, y: 1 }) },
        })],
      });
      expect(log.dancers.d2).toBeUndefined();
    });

    it("reports a move along y", () => {
      const log = compare(c => { c.sections[1].formation.dancerPositions.d2.y = 5; });
      expect(log.dancers.d2).toEqual({ kind: "changed", sections: [expect.objectContaining({ sectionId: "s2" })] });
    });

    it("lists each section the dancer moved in, in section order", () => {
      const log = compare(c => {
        c.sections[1].formation.dancerPositions.d1.x = 9;
        c.sections[0].formation.dancerPositions.d1.x = 9;
      });
      expect(log.dancers.d1.kind === "changed" && log.dancers.d1.sections.map(x => x.sectionId)).toEqual(["s1", "s2"]);
    });

    it("treats a position missing from the old section as having no previous position", () => {
      const log = compare(() => {}, c => { delete c.sections[0].formation.dancerPositions.d1; });
      expect(log.dancers.d1).toEqual({
        kind: "changed",
        sections: [expect.objectContaining({ sectionId: "s1", position: { to: expect.objectContaining({ x: 1 }) } })],
      });
    });
  });

  describe("sections", () => {
    it("reports added, removed and renamed sections", () => {
      const log = compare(c => {
        c.sections[0].name = "大サビ";
        c.sections[1] = { ...c.sections[1], id: "s3", name: "間奏" };
      });
      expect(log.overall.sections).toEqual({ added: ["間奏"], removed: ["サビ2"], renamed: [["サビ1", "大サビ"]], reordered: false });
    });

    it("gives the old name on a renamed section's dancer changes", () => {
      const log = compare(c => {
        c.sections[0].name = "大サビ";
        c.sections[0].formation.dancerPositions.d1.x = 9;
      });
      expect(log.dancers.d1).toEqual({ kind: "changed", sections: [expect.objectContaining({ oldSectionName: "サビ1" })] });
    });

    it("matches a re-created section by name", () => {
      const log = compare(c => { c.sections[1].id = "s2b"; });
      expect(hasShownChanges(log)).toBe(false);
    });

    it("does not match by name when the name is ambiguous", () => {
      const log = compare(
        c => { c.sections[1].id = "s2b"; c.sections.push({ ...copy(c.sections[1]), id: "s3b" }); },
        c => { c.sections.push({ ...copy(c.sections[1]), id: "s3" }); },
      );
      expect(log.overall.sections.added).toEqual(["サビ2", "サビ2"]);
      expect(log.overall.sections.removed).toEqual(["サビ2", "サビ2"]);
    });

    it.each<[string, (c: Choreo) => void, boolean]>([
      ["adding a section", c => addSection(c, 1, "s9", "間奏"), false],
      ["removing a section", c => { c.sections.splice(0, 1); }, false],
      ["swapping sections", c => { c.sections.reverse(); }, true],
    ])("reports a reorder correctly for %s", (_, change, reordered) => {
      expect(compare(change).overall.sections.reordered).toBe(reordered);
    });

    it("lists a new section for every dancer with position and counts", () => {
      const log = compare(c => {
        addSection(c, 2, "s3", "間奏");
        setActions(c, 2, action("a1", "振りA", [["t1", "1回目", ["d1"]]]));
      });
      expect(log.dancers.d1).toEqual({
        kind: "changed",
        sections: [expect.objectContaining({
          sectionId: "s3",
          isNew: true,
          position: { to: expect.objectContaining({ x: 1 }) },
          counts: [{ actionName: "振りA", from: [], to: ["1回目"] }],
        })],
      });
      expect(log.dancers.d2).toEqual({ kind: "changed", sections: [expect.objectContaining({ sectionId: "s3", counts: [] })] });
    });
  });

  describe("memos", () => {
    it("reports a changed memo by section", () => {
      expect(compare(c => { c.sections[1].note = "入り：右から"; }).overall.memos).toEqual(["s2"]);
    });

    it("does not report a memo in a new section", () => {
      expect(compare(c => { addSection(c, 2, "s3", "間奏"); c.sections[2].note = "メモ"; }).overall.memos).toEqual([]);
    });
  });

  describe("dancers", () => {
    it("marks a new dancer", () => {
      const log = compare(c => {
        c.dancers.d3 = { id: "d3", name: "ゆい" };
        c.sections.forEach(s => { s.formation.dancerPositions.d3 = { ...s.formation.dancerPositions.d1, dancerId: "d3" }; });
      });
      expect(log.dancers.d3).toEqual({ kind: "new" });
      expect(log.overall.dancers.added).toEqual(["ゆい"]);
    });

    it("lists a removed dancer only in the overall changes", () => {
      const log = compare(c => {
        delete c.dancers.d2;
        c.sections.forEach(s => { delete s.formation.dancerPositions.d2; });
      });
      expect(log.overall.dancers.removed).toEqual(["あおい"]);
      expect(log.dancers).toEqual({});
    });

    it("lists a renamed dancer only in the overall changes", () => {
      const log = compare(c => { c.dancers.d1.name = "さくら（A）"; });
      expect(log.overall.dancers.renamed).toEqual([["さくら", "さくら（A）"]]);
      expect(log.dancers).toEqual({});
    });

    const readd = (c: Choreo, newId: string, oldId = "d1") => {
      c.dancers[newId] = { ...c.dancers[oldId], id: newId };
      delete c.dancers[oldId];
      c.sections.forEach(s => {
        s.formation.dancerPositions[newId] = { ...s.formation.dancerPositions[oldId], dancerId: newId };
        delete s.formation.dancerPositions[oldId];
      });
    };

    it("matches a dancer removed and re-added under the same name", () => {
      expect(hasShownChanges(compare(c => readd(c, "d1b")))).toBe(false);
    });

    it("does not match a re-added dancer when the name is ambiguous", () => {
      const log = compare(c => {
        readd(c, "d1b");
        c.dancers.d2.name = "さくら";
        readd(c, "d2b", "d2");
      }, c => { c.dancers.d2.name = "さくら"; });
      expect(log.dancers.d1b).toEqual({ kind: "new" });
      expect(log.dancers.d2b).toEqual({ kind: "new" });
    });
  });

  describe("counts", () => {
    const old = (c: Choreo) => setActions(c, 0, action("a1", "振りA", [["t1", "1回目", ["d1"]], ["t2", "2回目", []]]));
    const countChanges = (log: ReturnType<typeof buildChangeLog>) =>
      log.dancers.d1?.kind === "changed" ? log.dancers.d1.sections.flatMap(x => x.counts) : [];

    it.each<[string, [string, string, string[]][], string[]]>([
      ["moved to another count", [["t1", "1回目", []], ["t2", "2回目", ["d1"]]], ["2回目"]],
      ["added to a second count", [["t1", "1回目", ["d1"]], ["t2", "2回目", ["d1"]]], ["1回目", "2回目"]],
      ["removed from the action", [["t1", "1回目", []], ["t2", "2回目", []]], []],
    ])("reports a dancer %s", (_, timings, to) => {
      const log = compare(c => setActions(c, 0, action("a1", "振りA", timings)), old);
      expect(countChanges(log)).toEqual([{ actionName: "振りA", from: ["1回目"], to }]);
    });

    it("reports a dancer added to an action they weren't in", () => {
      const log = compare(c => setActions(c, 0, action("a1", "振りA", [["t1", "1回目", ["d1"]]])));
      expect(countChanges(log)).toEqual([{ actionName: "振りA", from: [], to: ["1回目"] }]);
    });

    it("ignores reordered counts", () => {
      const log = compare(
        c => setActions(c, 0, action("a1", "振りA", [["t2", "2回目", ["d1"]], ["t1", "1回目", ["d1"]]])),
        c => setActions(c, 0, action("a1", "振りA", [["t1", "1回目", ["d1"]], ["t2", "2回目", ["d1"]]])),
      );
      expect(hasShownChanges(log)).toBe(false);
    });

    it("reports a count rename only in the overall actions", () => {
      const log = compare(c => setActions(c, 0, action("a1", "振りA", [["t1", "最初", ["d1"]], ["t2", "2回目", []]])), old);
      expect(log.dancers).toEqual({});
      expect(log.overall.actions).toEqual([{ sectionId: "s1", actionName: "振りA", countName: "最初", change: "renamed", oldName: "1回目" }]);
    });

    it("does not match counts by name", () => {
      const log = compare(c => setActions(c, 0, action("a1", "振りA", [["t9", "1回目", ["d1"]], ["t2", "2回目", []]])), old);
      expect(log.overall.actions.map(x => x.change)).toEqual(["added", "removed"]);
      expect(countChanges(log)).toEqual([{ actionName: "振りA", from: ["1回目"], to: ["1回目"] }]);
    });
  });

  describe("overall actions", () => {
    it("reports added, removed and renamed actions and counts, in section order", () => {
      const log = compare(
        c => {
          setActions(c, 0, action("a1", "振りA2", [["t1", "1回目", []], ["t3", "3回目", []]]), action("a3", "振りC", []));
          setActions(c, 1, action("a4", "振りD", []));
        },
        c => {
          setActions(c, 0, action("a1", "振りA", [["t1", "1回目", []], ["t2", "2回目", []]]), action("a2", "振りB", []));
        },
      );
      expect(log.overall.actions).toEqual([
        { sectionId: "s1", actionName: "振りA2", change: "renamed", oldName: "振りA" },
        { sectionId: "s1", actionName: "振りA2", countName: "3回目", change: "added" },
        { sectionId: "s1", actionName: "振りA2", countName: "2回目", change: "removed" },
        { sectionId: "s1", actionName: "振りC", change: "added" },
        { sectionId: "s1", actionName: "振りB", change: "removed" },
        { sectionId: "s2", actionName: "振りD", change: "added" },
      ]);
    });

    it("does not list actions in a new section", () => {
      const log = compare(c => { addSection(c, 2, "s3", "間奏"); setActions(c, 2, action("a1", "振りA", [])); });
      expect(log.overall.actions).toEqual([]);
    });
  });

  describe("paths", () => {
    const pathChangedIn = (log: ReturnType<typeof buildChangeLog>) =>
      log.dancers.d1?.kind === "changed" ? log.dancers.d1.sections.filter(x => x.pathChanged).map(x => x.sectionId) : [];
    const midpoint = [{ x: 2, y: 1.5 }];

    it.each<[string, (c: Choreo) => void, (c: Choreo) => void]>([
      ["a midpoint moves", c => setPath(c, midpoint, "curved"), c => setPath(c, [{ x: 3, y: 1.5 }], "curved")],
      ["a midpoint is added", () => {}, c => setPath(c, midpoint, "curved")],
      ["a midpoint is removed", c => setPath(c, midpoint, "curved"), c => setPath(c, [], "curved")],
      ["the tension changes", c => setPath(c, midpoint, "curved"), c => setPath(c, midpoint, "straight")],
    ])("reports a path change under the section it starts from when %s", (_, oldChange, change) => {
      expect(pathChangedIn(compare(change, oldChange))).toEqual(["s1"]);
    });

    it.each<[string, (c: Choreo) => void, (c: Choreo) => void]>([
      ["the tension changes with no midpoints", c => setPath(c, [], "curved"), c => setPath(c, [], "straight")],
      ["a missing path becomes an empty curved one", () => {}, c => setPath(c, [], "curved")],
      ["a missing tension becomes curved", c => setPath(c, midpoint), c => setPath(c, midpoint, "curved")],
    ])("ignores a path where %s", (_, oldChange, change) => {
      expect(hasShownChanges(compare(change, oldChange))).toBe(false);
    });

    it("does not report a path change when only the end point moves", () => {
      const log = compare(c => {
        setPath(c, midpoint, "curved");
        c.sections[1].formation.dancerPositions.d1.x = 4;
      }, c => setPath(c, midpoint, "curved"));
      expect(pathChangedIn(log)).toEqual([]);
      expect(log.dancers.d1).toEqual({ kind: "changed", sections: [expect.objectContaining({ sectionId: "s2" })] });
    });
  });

  describe("props", () => {
    it("folds moves and in-use toggles into one line per prop, whether or not it's in use", () => {
      const log = compare(c => {
        c.sections[0].formation.propPositions.p1.x = 7;
        c.sections[1].formation.propPositions.p1.inUse = true;
      });
      expect(log.overall.props.lines).toEqual([{ name: "旗", moved: ["s1"], nowInUse: ["s2"], nowUnused: [] }]);
    });

    it("reports a rotation as a move, even when the corner stays put", () => {
      const log = compare(c => { c.sections[0].formation.propPositions.p1.rotation = 180; });
      expect(log.overall.props.lines).toEqual([{ name: "旗", moved: ["s1"], nowInUse: [], nowUnused: [] }]);
    });

    it("ignores a prop rotation under half a degree", () => {
      const log = compare(c => { c.sections[0].formation.propPositions.p1.rotation = 0.4; });
      expect(hasShownChanges(log)).toBe(false);
    });

    it("reports a prop no longer in use", () => {
      const log = compare(() => {}, c => { c.sections[0].formation.propPositions.p1.inUse = true; });
      expect(log.overall.props.lines).toEqual([{ name: "旗", moved: [], nowInUse: [], nowUnused: ["s1"] }]);
    });

    it("treats a missing in-use flag as unused", () => {
      const log = compare(() => {}, c => { delete c.sections[0].formation.propPositions.p1.inUse; });
      expect(hasShownChanges(log)).toBe(false);
    });

    it("reports added, removed and renamed props", () => {
      const log = compare(c => {
        c.props.p1.name = "大旗";
        c.props.p2 = { id: "p2", name: "扇", color: "#000000", length: 1, width: 1 };
      }, c => {
        c.props.p3 = { id: "p3", name: "傘", color: "#000000", length: 1, width: 1 };
      });
      expect(log.overall.props).toEqual({ added: ["扇"], removed: ["傘"], renamed: [["旗", "大旗"]], lines: [] });
    });
  });

  describe("obstacles", () => {
    it.each<[string, Partial<Obstacle>, string[]]>([
      ["position", { x: 2 }, ["position"]],
      ["size", { width: 2 }, ["size"]],
      ["rotation", { rotation: 90 }, ["rotation"]],
      ["position and size", { y: 3, length: 2 }, ["position", "size"]],
    ])("reports a %s change", (_, change, fields) => {
      const log = compare(c => { c.obstacles = { o1: { ...obstacle, ...change } }; }, c => { c.obstacles = { o1: obstacle }; });
      expect(log.overall.obstacles.lines).toEqual([{ name: "柱", fields }]);
    });

    it("ignores rotation under half a degree", () => {
      const log = compare(c => { c.obstacles = { o1: { ...obstacle, rotation: 0.4 } }; }, c => { c.obstacles = { o1: obstacle }; });
      expect(hasShownChanges(log)).toBe(false);
    });

    it("reports added, removed and renamed obstacles", () => {
      const log = compare(c => {
        c.obstacles = { o1: { ...obstacle, name: "大柱" }, o2: { ...obstacle, id: "o2", name: "段差" } };
      }, c => {
        c.obstacles = { o1: obstacle, o3: { ...obstacle, id: "o3", name: "花道" } };
      });
      expect(log.overall.obstacles).toEqual({ added: ["段差"], removed: ["花道"], renamed: [["柱", "大柱"]], lines: [] });
    });
  });
});
