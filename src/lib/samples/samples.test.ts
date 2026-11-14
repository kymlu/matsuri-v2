import { ChoreoSchema } from "../../models/choreo";
import { normalizeStacks } from "../helpers/stackHelper";
import { getAnchorRange } from "../helpers/editorCalculationHelper";
import Stage from "./SampleStageFormation.json";
import Parade from "./SampleParadeFormation.json";

// The samples are hand-built data, so check them the way the editor would see them.
test.each([["stage", Stage], ["parade", Parade]])("the %s sample is valid, stacked in normal form, in bounds and not overlapping", (_, raw) => {
  const c = ChoreoSchema.parse(raw);
  expect(normalizeStacks(c)).toBe(c);
  const problems: string[] = [];
  for (const s of c.sections) {
    const f = s.formation;
    const stacked = new Set((f.dancerStacks ?? []).flatMap(x => x.slice(1)));
    const ds = Object.values(f.dancerPositions);
    for (const d of ds) {
      if (d.x < 0 || d.x > c.stageGeometry.stageWidth || d.y < 0 || d.y > c.stageGeometry.stageLength) problems.push(`${s.name} ${c.dancers[d.dancerId].name} off stage ${d.x},${d.y}`);
    }
    const vis = ds.filter(d => !stacked.has(d.dancerId));
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const dist = Math.hypot(vis[i].x - vis[j].x, vis[i].y - vis[j].y);
      if (dist < 0.9) problems.push(`${s.name} ${c.dancers[vis[i].dancerId].name}-${c.dancers[vis[j].dancerId].name} ${dist.toFixed(2)}`);
    }
    for (const p of Object.values(f.propPositions)) {
      const prop = c.props[p.propId];
      const r = getAnchorRange(c.stageGeometry, p.rotation, prop.width, prop.length);
      if (p.x < r.minX - 1e-6 || p.x > r.maxX + 1e-6 || p.y < r.minY - 1e-6 || p.y > r.maxY + 1e-6) problems.push(`${s.name} prop ${prop.name} out ${p.x},${p.y}`);
    }
  }
  expect(problems).toEqual([]);
});
