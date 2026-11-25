import { StageGeometry } from "../../models/choreo";
import { DancerPosition } from "../../models/dancer";
import { StageEntities } from "../../models/history";
import { Obstacle, Prop, PropPosition } from "../../models/prop";
import { METER_PX } from "../consts/consts";
import { Coordinates } from "../../models/base";
import { cornerToCentre, stageMetersToPx } from "./editorCalculationHelper";

export type BoxSelectInput = {
  geometry: StageGeometry,
  dancerPositions: DancerPosition[],
  propPositions: PropPosition[],
  props: Record<string, Prop>,
  obstacles: Obstacle[],
  canSelectDancers: boolean,
  canSelectProps: boolean,
  canSelectObstacles: boolean,
  excludedDancerIds?: ReadonlySet<string>,
};

// Ids whose centre is inside the box (stage px, any two corners).
export function idsInBox(a: Coordinates, b: Coordinates, input: BoxSelectInput): StageEntities<string[]> {
  const { geometry } = input;
  const inside = (p: Coordinates) =>
    p.x >= Math.min(a.x, b.x) && p.x <= Math.max(a.x, b.x) &&
    p.y >= Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y);
  const centreOf = (x: number, y: number, rotation: number | undefined, width: number, length: number) => {
    const corner = stageMetersToPx({ x, y }, geometry, METER_PX, length);
    return cornerToCentre(corner.x, corner.y, rotation ?? 0, width * METER_PX, length * METER_PX, geometry.yAxis);
  };
  const dancers = !input.canSelectDancers ? [] : input.dancerPositions
    .filter(p => !input.excludedDancerIds?.has(p.dancerId))
    .filter(p => inside(stageMetersToPx({ x: p.x, y: p.y }, geometry, METER_PX)))
    .map(p => p.dancerId);
  const props = !input.canSelectProps ? [] : input.propPositions
    .filter(p => input.props[p.propId])
    .filter(p => inside(centreOf(p.x, p.y, p.rotation, input.props[p.propId].width, input.props[p.propId].length)))
    .map(p => p.propId);
  const obstacles = !input.canSelectObstacles ? [] : input.obstacles
    .filter(o => inside(centreOf(o.x, o.y, o.rotation, o.width, o.length)))
    .map(o => o.id);

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
