import { memo } from "react";
import { Arrow, Circle, Group, Layer, Path } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Coordinates } from "../../../models/base";
import { getPathLineSvgCached, movementTension, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { METER_PX } from "../../../lib/consts/consts";
import { colorPalette } from "../../../lib/consts/colors";
import { Movement } from "../../../models/choreoSection";

// path: their custom path in the arrangement shown, if any.
export type PreviewRoute = { id: string, from: Coordinates, to: Coordinates, color: string, changed: boolean, path?: Movement };

// 最短距離 routes from the previous section: changed ones red (今) or green (最短), the rest grey.
const ROUTE_COLOURS = { now: colorPalette.rainbow.red[0], after: "#2E8B57" };

const PreviewRoutesLayer = memo(function PreviewRoutesLayer({ geometry, routes, kind, largeDancers }: {
  geometry: StageGeometry,
  routes: PreviewRoute[],
  kind: "now" | "after",
  largeDancers?: boolean,
}) {
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
      // Arrow ends at the person's edge, pointing from the last bend.
      const length = Math.hypot(to.x - before.x, to.y - before.y) || 1;
      const cut = Math.min(PERSON_RADIUS, length / 2) / length;
      const tip = { x: to.x - (to.x - before.x) * cut, y: to.y - (to.y - before.y) * cut };
      if (points.length === 2) {
        return <Arrow key={r.id} points={[before.x, before.y, tip.x, tip.y]} {...style}/>;
      }
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
