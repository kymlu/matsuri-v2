import { Coordinates } from "../../models/base";
import { StageGeometry } from "../../models/choreo";
import { DancerPosition } from "../../models/dancer";
import { StageEntities } from "../../models/history";
import { METER_PX } from "../consts/consts";
import { stageMetersToPx } from "./editorCalculationHelper";

export type Bounds = { x: number, y: number, width: number, height: number };

export type BoxSelectInput = {
  geometry: StageGeometry,
  dancerPositions: DancerPosition[],
  propIds: string[],
  obstacleIds: string[],
  // Drawn bounds in stage px; for a rotated shape, the box around its corners.
  boundsOf: (id: string) => Bounds | undefined,
  canSelectDancers: boolean,
  canSelectProps: boolean,
  canSelectObstacles: boolean,
  excludedDancerIds?: ReadonlySet<string>,
};

// Dancers count when their centre is inside the box; props and obstacles only when wholly inside.
export function idsInBox(a: Coordinates, b: Coordinates, input: BoxSelectInput): StageEntities<string[]> {
  const left = Math.min(a.x, b.x), right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
  const pointInside = (p: Coordinates) => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
  const whollyInside = (id: string) => {
    const r = input.boundsOf(id);
    return !!r && r.x >= left && r.x + r.width <= right && r.y >= top && r.y + r.height <= bottom;
  };

  const dancers = !input.canSelectDancers ? [] : input.dancerPositions
    .filter(p => !input.excludedDancerIds?.has(p.dancerId))
    .filter(p => pointInside(stageMetersToPx({ x: p.x, y: p.y }, input.geometry, METER_PX)))
    .map(p => p.dancerId);
  const props = !input.canSelectProps ? [] : input.propIds.filter(whollyInside);
  const obstacles = !input.canSelectObstacles ? [] : input.obstacleIds.filter(whollyInside);

  return { dancers, props, obstacles };
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
