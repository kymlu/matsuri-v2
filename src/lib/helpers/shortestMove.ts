import { Formation } from "../../models/choreoSection";
import { StageEntities } from "../../models/history";
import { assign } from "./assignment";
import { getStacks, UnitMove } from "./stackHelper";

// 最短距離: among the selected people, swap who stands on which spot so the total straight-line distance
// from the previous section is as short as possible. Spots never move; stacked people never move.

// Savings smaller than this (metres, in total) are not worth changing anyone's spot for.
export const MIN_SAVING = 0.5;
// Makes staying put win any tie, so an already-shortest arrangement is left as it is.
const STAY_BONUS = 1e-6;

export type ShortestMovePlan = {
  // Single people only, each onto the spot of the person standing there now.
  moves: UnitMove[],
  // The people who were considered (selected, outside stacks, in the previous section).
  considered: string[],
  totalBefore: number,
  totalAfter: number,
  // Someone who would change spot has counts in this section.
  countsAffected: boolean,
  // The selection included stacked people, who were left where they are.
  skippedStacked: boolean,
};

// Nothing selected at all means everyone.
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

// The cheap check behind the toolbar button.
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
  // Colours left out stay where they are. Only meaningful with sameColour, where colours never mix.
  const considered = sameColour && excludeColours?.size ? all.filter(id => !excludeColours.has(here[id].color)) : all;
  const distance = (id: string, spotOf: string) => {
    const from = prev!.dancerPositions[id], to = here[spotOf];
    return Math.hypot(to.x - from.x, to.y - from.y);
  };

  const groups = new Map<string, string[]>();
  considered.forEach(id => {
    const key = sameColour ? here[id].color : "";
    groups.set(key, [...(groups.get(key) ?? []), id]);
  });

  // Left-out colours still count towards the totals, where they stand.
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
