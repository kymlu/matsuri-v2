import { Choreo } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { DancerAction } from "../../models/dancerAction";
import SampleStage from "../samples/SampleStageFormation.json";
import { buildChangeLog, hasShownChanges } from "./changeLogHelper";

// Two sections (s1, s2), two dancers (d1, d2), one prop (p1). Each test copies and edits it.
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

const action = (id: string, name: string, timings: [string, string, string[]][]): DancerAction => ({
  id,
  name,
  timings: timings.map(([timingId, timingName, dancerIds]) => ({ id: timingId, name: timingName, dancerIds })),
});

describe("buildChangeLog", () => {
  it("finds no changes between identical choreos", () => {
    const sample = SampleStage as Choreo;
    expect(hasShownChanges(buildChangeLog(sample, copy(sample)))).toBe(false);
  });

  it("ignores moves under 0.1m and reports larger ones", () => {
    const small = edit(c => { c.sections[0].formation.dancerPositions.d1.x = 1.04; });
    expect(hasShownChanges(buildChangeLog(makeChoreo(), small))).toBe(false);

    const large = edit(c => { c.sections[0].formation.dancerPositions.d1.x = 1.5; });
    const log = buildChangeLog(makeChoreo(), large);
    expect(log.dancers.d1).toEqual({
      kind: "changed",
      sections: [expect.objectContaining({ sectionId: "s1", position: { from: expect.objectContaining({ x: 1 }), to: expect.objectContaining({ x: 1.5 }) } })],
    });
    expect(log.dancers.d2).toBeUndefined();
  });

  it("does not move dancers when only the stage size changes", () => {
    const log = buildChangeLog(makeChoreo(), edit(c => { c.stageGeometry.stageWidth = 12; }));
    expect(log.overall.stage).toBeDefined();
    expect(log.dancers).toEqual({});
  });

  it("ignores hidden changes", () => {
    const hidden = edit(c => {
      c.name = "新しい名前";
      c.sections[0].duration = 30;
      c.sections[0].formation.dancerPositions.d1.color = "#ffffff";
      c.sections[0].formation.dancerPositions.d1.rotation = 90;
      c.props.p1.color = "#ffffff";
      c.stageGeometry.margin.topMargin = 3;
      c.dancers.d1.name = " さくら ";
    });
    expect(hasShownChanges(buildChangeLog(makeChoreo(), hidden))).toBe(false);
  });

  it("compares an old file with missing optional fields", () => {
    const old = makeChoreo();
    delete old.obstacles;
    delete old.sections[0].note;
    expect(hasShownChanges(buildChangeLog(old, makeChoreo()))).toBe(false);
  });

  it("reports count changes for the dancer and count renames only in actions", () => {
    const old = edit(c => { c.sections[0].formation.dancerActions = [action("a1", "振りA", [["t1", "1回目", ["d1"]], ["t2", "2回目", []]])]; });
    const moved = edit(c => { c.sections[0].formation.dancerActions = [action("a1", "振りA", [["t1", "1回目", []], ["t2", "2回目", ["d1"]]])]; });
    expect(buildChangeLog(old, moved).dancers.d1).toEqual({
      kind: "changed",
      sections: [expect.objectContaining({ counts: [{ actionName: "振りA", from: ["1回目"], to: ["2回目"] }] })],
    });

    const renamed = edit(c => { c.sections[0].formation.dancerActions = [action("a1", "振りA", [["t1", "最初", ["d1"]], ["t2", "2回目", []]])]; });
    const log = buildChangeLog(old, renamed);
    expect(log.dancers).toEqual({});
    expect(log.overall.actions).toEqual([{ sectionId: "s1", actionName: "振りA", countName: "最初", change: "renamed", oldName: "1回目" }]);
  });

  it("matches a re-created section by name only when unambiguous", () => {
    const recreated = edit(c => { c.sections[1].id = "s2b"; });
    expect(buildChangeLog(makeChoreo(), recreated).overall.sections).toEqual({ added: [], removed: [], renamed: [], reordered: false });

    const old = edit(c => { c.sections.push({ ...copy(c.sections[1]), id: "s3" }); });
    const ambiguous = edit(c => {
      c.sections[1].id = "s2b";
      c.sections.push({ ...copy(c.sections[1]), id: "s3b" });
    });
    const sections = buildChangeLog(old, ambiguous).overall.sections;
    expect(sections.added).toEqual(["サビ2", "サビ2"]);
    expect(sections.removed).toEqual(["サビ2", "サビ2"]);
  });

  it("reports a reorder only when existing sections change order", () => {
    const added = edit(c => { c.sections.splice(1, 0, { ...copy(c.sections[0]), id: "s9", name: "間奏" }); });
    expect(buildChangeLog(makeChoreo(), added).overall.sections.reordered).toBe(false);

    const swapped = edit(c => { c.sections.reverse(); });
    expect(buildChangeLog(makeChoreo(), swapped).overall.sections.reordered).toBe(true);
  });

  it("lists a new section with position and no previous position", () => {
    const added = edit(c => { c.sections.push({ ...copy(c.sections[1]), id: "s3", name: "間奏" }); });
    const entry = buildChangeLog(makeChoreo(), added).dancers.d1;
    expect(entry).toEqual({
      kind: "changed",
      sections: [expect.objectContaining({ sectionId: "s3", isNew: true, position: { to: expect.objectContaining({ y: 2 }) } })],
    });
  });

  it("reports path midpoint and tension changes under the section the path starts from", () => {
    const withPath = edit(c => { c.sections[1].formation.dancerMovements = { d1: { points: [{ x: 2, y: 1.5 }], tension: "curved" } }; });

    const movedMidpoint = edit(c => { c.sections[1].formation.dancerMovements = { d1: { points: [{ x: 3, y: 1.5 }], tension: "curved" } }; });
    expect(buildChangeLog(withPath, movedMidpoint).dancers.d1).toEqual({
      kind: "changed",
      sections: [expect.objectContaining({ sectionId: "s1", pathChanged: true })],
    });

    const straightened = edit(c => { c.sections[1].formation.dancerMovements = { d1: { points: [{ x: 2, y: 1.5 }], tension: "straight" } }; });
    expect(buildChangeLog(withPath, straightened).dancers.d1).toBeDefined();
  });

  it("does not report a path change when only the end point moves", () => {
    const old = edit(c => { c.sections[1].formation.dancerMovements = { d1: { points: [{ x: 2, y: 1.5 }], tension: "curved" } }; });
    const movedEnd = edit(c => {
      c.sections[1].formation.dancerMovements = { d1: { points: [{ x: 2, y: 1.5 }], tension: "curved" } };
      c.sections[1].formation.dancerPositions.d1.x = 4;
    });
    const entry = buildChangeLog(old, movedEnd).dancers.d1;
    expect(entry).toEqual({
      kind: "changed",
      sections: [expect.objectContaining({ sectionId: "s2", pathChanged: false })],
    });
  });

  it("folds unused prop moves and in-use toggles into one line per prop", () => {
    const changed = edit(c => {
      c.sections[0].formation.propPositions.p1.x = 7;
      c.sections[1].formation.propPositions.p1.inUse = true;
    });
    expect(buildChangeLog(makeChoreo(), changed).overall.props.lines).toEqual([
      { name: "旗", moved: ["s1"], nowInUse: ["s2"], nowUnused: [] },
    ]);
  });

  it("marks new dancers and matches a re-added dancer by unique name", () => {
    const added = edit(c => {
      c.dancers.d3 = { id: "d3", name: "ゆい" };
      c.sections.forEach(s => { s.formation.dancerPositions.d3 = { ...s.formation.dancerPositions.d1, dancerId: "d3" }; });
    });
    const log = buildChangeLog(makeChoreo(), added);
    expect(log.dancers.d3).toEqual({ kind: "new" });
    expect(log.overall.dancers.added).toEqual(["ゆい"]);

    const readded = edit(c => {
      c.dancers = { d1b: { id: "d1b", name: "さくら" }, d2: c.dancers.d2 };
      c.sections.forEach(s => {
        s.formation.dancerPositions.d1b = { ...s.formation.dancerPositions.d1, dancerId: "d1b" };
        delete s.formation.dancerPositions.d1;
      });
    });
    expect(hasShownChanges(buildChangeLog(makeChoreo(), readded))).toBe(false);
  });

  it("reports obstacle changes by field", () => {
    const obstacle = { id: "o1", name: "柱", x: 1, y: 1, sectionId: "", type: "obstacle" as const, color: "#000000", length: 1, width: 1 };
    const old = edit(c => { c.obstacles = { o1: obstacle }; });
    const changed = edit(c => { c.obstacles = { o1: { ...obstacle, x: 2, width: 2 } }; });
    expect(buildChangeLog(old, changed).overall.obstacles.lines).toEqual([{ name: "柱", fields: ["position", "size"] }]);
  });
});
