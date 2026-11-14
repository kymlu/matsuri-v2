import { ChoreoSchema } from "../../models/choreo";
import { normalizeStacks } from "../helpers/stackHelper";
import { getAnchorRange } from "../helpers/editorCalculationHelper";
import Stage from "./SampleStageFormation.json";
import Parade from "./SampleParadeFormation.json";

// The samples are hand-built data, so check them the way the editor would see them.
test.each([["stage", Stage], ["parade", Parade]])("the %s sample is valid, stacked in normal form, on the stage and not overlapping", (_, raw) => {
  const c = ChoreoSchema.parse(raw);
  expect(normalizeStacks(c)).toBe(c);
  const problems: string[] = [];
  for (const s of c.sections) {
    const f = s.formation;
    const stacked = new Set((f.dancerStacks ?? []).flatMap(x => x.slice(1)));
    const ds = Object.values(f.dancerPositions);
    for (const d of ds) {
      // People may wait in the margins (staff in the wings); props may not (below).
      const r = getAnchorRange(c.stageGeometry);
      if (d.x < r.minX || d.x > r.maxX || d.y < r.minY || d.y > r.maxY) problems.push(`${s.name} ${c.dancers[d.dancerId].name} off the grid ${d.x},${d.y}`);
    }
    const vis = ds.filter(d => !stacked.has(d.dancerId));
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const dist = Math.hypot(vis[i].x - vis[j].x, vis[i].y - vis[j].y);
      if (dist < 0.9) problems.push(`${s.name} ${c.dancers[vis[i].dancerId].name}-${c.dancers[vis[j].dancerId].name} ${dist.toFixed(2)}`);
    }
    for (const p of Object.values(f.propPositions)) {
      const prop = c.props[p.propId];
      // Props stay on the stage itself, not in the margins.
      const noMargins = { ...c.stageGeometry, margin: { topMargin: 0, bottomMargin: 0, leftMargin: 0, rightMargin: 0 } };
      const r = getAnchorRange(noMargins, p.rotation, prop.width, prop.length);
      if (p.x < r.minX - 1e-6 || p.x > r.maxX + 1e-6 || p.y < r.minY - 1e-6 || p.y > r.maxY + 1e-6) problems.push(`${s.name} prop ${prop.name} out ${p.x},${p.y}`);
    }
  }
  expect(problems).toEqual([]);
});
