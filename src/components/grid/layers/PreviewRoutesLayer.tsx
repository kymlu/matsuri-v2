import { memo } from "react";
import { Arrow, Circle, Group, Layer, Path } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Coordinates } from "../../../models/base";
import { getPathLineSvgCached, movementTension, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { METER_PX } from "../../../lib/consts/consts";
import { colorPalette } from "../../../lib/consts/colors";
import { Movement } from "../../../models/choreoSection";

// changed: this person's spot is different in the proposal. path: their custom path, if they have one in the
// arrangement shown (people who change spot have theirs reset, so walk straight).
export type PreviewRoute = { id: string, from: Coordinates, to: Coordinates, color: string, changed: boolean, path?: Movement };

// Routes from the previous section while previewing a change (最短距離), drawn as they will be walked:
// a faint dashed circle where each person stood before, and an arrow to where they stand now.
// People whose spot changes: red in "now" (what is there today), green in "after" (the proposal). Everyone else's
// route is grey, thinner and lighter: context, not a change. Nothing here can be touched.
const ROUTE_COLOURS = { now: colorPalette.rainbow.red[0], after: "#2E8B57" };

const PreviewRoutesLayer = memo(function PreviewRoutesLayer({ geometry, routes, kind, largeDancers }: {
  geometry: StageGeometry,
  routes: PreviewRoute[],
  kind: "now" | "after",
  largeDancers?: boolean,
}) {
  // Just outside the person's circle (as drawn by DancerGridObject).
  const PERSON_RADIUS = METER_PX * (largeDancers ? 0.62 : 0.32);
  return <Layer listening={false}>
    {routes.map(r => {
      const from = stageMetersToPx(r.from, geometry, METER_PX);
      return <Circle key={r.id + "-from"} x={from.x} y={from.y} radius={PERSON_RADIUS}
        stroke={r.color} strokeWidth={1.5} opacity={0.6} dash={[3, 3]} perfectDrawEnabled={false}/>;
    })}
    {routes.map(r => {
      const colour = r.changed ? ROUTE_COLOURS[kind] : colorPalette.grey;
      const style = {
        stroke: colour, fill: colour, strokeWidth: r.changed ? 2 : 1.5, opacity: r.changed ? 0.85 : 0.5,
        pointerLength: r.changed ? 6 : 5, pointerWidth: r.changed ? 6 : 5, perfectDrawEnabled: false,
      };
      const points = [r.from, ...(r.path?.points ?? []), r.to].map(p => stageMetersToPx(p, geometry, METER_PX));
      const to = points[points.length - 1], before = points[points.length - 2];
      // The arrowhead stops at the edge of the person, so it isn't hidden under them. It points the way the
      // route arrives: from the last bend (or the start) to the person.
      const length = Math.hypot(to.x - before.x, to.y - before.y) || 1;
      const cut = Math.min(PERSON_RADIUS, length / 2) / length;
      const tip = { x: to.x - (to.x - before.x) * cut, y: to.y - (to.y - before.y) * cut };
      if (points.length === 2) {
        return <Arrow key={r.id} points={[before.x, before.y, tip.x, tip.y]} {...style}/>;
      }
      // A custom path: drawn like the stage's own paths, with the arrowhead on its last stretch.
      const back = Math.min(1, 6 / length);
      return <Group key={r.id}>
        <Path data={getPathLineSvgCached(points.flatMap(p => [p.x, p.y]), movementTension(r.path))}
          stroke={colour} strokeWidth={style.strokeWidth} opacity={style.opacity} perfectDrawEnabled={false}/>
        <Arrow points={[tip.x - (to.x - before.x) * back, tip.y - (to.y - before.y) * back, tip.x, tip.y]} {...style}/>
      </Group>;
    })}
  </Layer>;
});

export default PreviewRoutesLayer;
