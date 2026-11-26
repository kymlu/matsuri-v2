import { Coordinates } from "../../models/base";
import { StageEntities } from "../../models/history";

export type Bounds = { x: number, y: number, width: number, height: number };

export type BoxSelectInput = {
  dancerIds: string[],
  propIds: string[],
  obstacleIds: string[],
  // Drawn bounds in stage px; for a rotated shape, the box around its corners.
  boundsOf: (id: string) => Bounds | undefined,
  canSelectDancers: boolean,
  canSelectProps: boolean,
  canSelectObstacles: boolean,
  excludedDancerIds?: ReadonlySet<string>,
};

// Everything whose drawn shape is wholly inside the box (any two corners, stage px).
export function idsInBox(a: Coordinates, b: Coordinates, input: BoxSelectInput): StageEntities<string[]> {
  const left = Math.min(a.x, b.x), right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
  const whollyInside = (id: string) => {
    const r = input.boundsOf(id);
    return !!r && r.x >= left && r.x + r.width <= right && r.y >= top && r.y + r.height <= bottom;
  };

  return {
    dancers: !input.canSelectDancers ? [] : input.dancerIds.filter(id => !input.excludedDancerIds?.has(id) && whollyInside(id)),
    props: !input.canSelectProps ? [] : input.propIds.filter(whollyInside),
    obstacles: !input.canSelectObstacles ? [] : input.obstacleIds.filter(whollyInside),
  };
}

// Adds to the current selection; never removes.
export function addToSelection(current: StageEntities<string[]>, added: StageEntities<string[]>): StageEntities<string[]> {
  const merge = (a: string[], b: string[]) => b.every(id => a.includes(id)) ? a : [...a, ...b.filter(id => !a.includes(id))];
  const dancers = merge(current.dancers, added.dancers);
  const props = merge(current.props, added.props);
  const obstacles = merge(current.obstacles, added.obstacles);
  if (dancers === current.dancers && props === current.props && obstacles === current.obstacles) return current;
  return { dancers, props, obstacles };
}
