import { Formation } from "../../models/choreoSection";
import { StageEntities } from "../../models/history";
import { assign } from "./assignment";
import { getPathLength, movementTension } from "./editorCalculationHelper";
import { getStacks, UnitMove } from "./stackHelper";

// 最短距離: reassign selected people to the same spots to minimise total distance from the previous section.
// Stayers keep their path (curves count); movers walk straight. Stacked people stay.

// Minimum total saving (m) worth changing anything for.
export const MIN_SAVING = 0.5;
// Staying put wins ties.
const STAY_BONUS = 1e-6;

export type ShortestMovePlan = {
  moves: UnitMove[],
  considered: string[],
  totalBefore: number,
  totalAfter: number,
  countsAffected: boolean,
  skippedStacked: boolean,
};

// No selection means everyone.
function selectedDancers(formation: Formation, selected: StageEntities<string[]>): string[] {
  const nothing = selected.dancers.length + selected.props.length + selected.obstacles.length === 0;
  return nothing ? Object.keys(formation.dancerPositions) : selected.dancers.filter(id => formation.dancerPositions[id]);
}

function candidates(prev: Formation | undefined, formation: Formation, selected: StageEntities<string[]>) {
  const stacked = new Set(getStacks(formation, "dancers").flat());
  const ids = selectedDancers(formation, selected);
  return {
    considered: ids.filter(id => !stacked.has(id) && prev?.dancerPositions[id] !== undefined),
    skippedStacked: ids.some(id => stacked.has(id)),
  };
}

export function canPlanShortestMoves(prev: Formation | undefined, formation: Formation, selected: StageEntities<string[]>): boolean {
  return prev !== undefined && candidates(prev, formation, selected).considered.length >= 2;
}

export function planShortestMoves(
  prev: Formation | undefined,
  formation: Formation,
  selected: StageEntities<string[]>,
  { sameColour, excludeColours }: { sameColour: boolean, excludeColours?: ReadonlySet<string> },
): ShortestMovePlan {
  const here = formation.dancerPositions;
  const { considered: all, skippedStacked } = candidates(prev, formation, selected);
  const considered = excludeColours?.size ? all.filter(id => !excludeColours.has(here[id].color)) : all;
  const distance = (id: string, spotOf: string) => {
    const from = prev!.dancerPositions[id], to = here[spotOf];
    const path = spotOf === id ? formation.dancerMovements?.[id] : undefined;
    if (!path?.points.length) return Math.hypot(to.x - from.x, to.y - from.y);
    return getPathLength([from, ...path.points, to].flatMap(p => [p.x, p.y]), movementTension(path));
  };

  const groups = new Map<string, string[]>();
  considered.forEach(id => {
    const key = sameColour ? here[id].color : "";
    groups.set(key, [...(groups.get(key) ?? []), id]);
  });

  // Left-out colours still count in the totals.
  const kept = all.filter(id => !considered.includes(id)).reduce((sum, id) => sum + distance(id, id), 0);
  let totalBefore = kept, totalAfter = kept;
  const moves: UnitMove[] = [];
  groups.forEach(ids => {
    const cost = ids.map((id, i) => ids.map((spotOf, j) => distance(id, spotOf) - (i === j ? STAY_BONUS : 0)));
    const best = assign(cost);
    ids.forEach((id, i) => {
      totalBefore += distance(id, id);
      totalAfter += distance(id, ids[best[i]]);
      if (best[i] !== i) moves.push({ unit: [id], target: [ids[best[i]]] });
    });
  });

  if (totalBefore - totalAfter < MIN_SAVING) {
    return { moves: [], considered, totalBefore, totalAfter: totalBefore, countsAffected: false, skippedStacked };
  }
  const movers = new Set(moves.map(m => m.unit[0]));
  const countsAffected = formation.dancerActions.some(a => a.timings.some(t => t.dancerIds.some(id => movers.has(id))));
  return { moves, considered, totalBefore, totalAfter, countsAffected, skippedStacked };
}
