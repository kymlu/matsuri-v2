import { memo } from "react";
import { Arrow, Circle, Layer } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Coordinates } from "../../../models/base";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { METER_PX } from "../../../lib/consts/consts";
import { colorPalette } from "../../../lib/consts/colors";

// changed: this person's spot is different in the proposal.
export type PreviewRoute = { id: string, from: Coordinates, to: Coordinates, color: string, changed: boolean };

// Straight-line routes from the previous section while previewing a change (最短距離):
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
      const from = stageMetersToPx(r.from, geometry, METER_PX);
      const to = stageMetersToPx(r.to, geometry, METER_PX);
      // Stop at the edge of the person, so the arrowhead isn't hidden under them.
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      const cut = Math.min(PERSON_RADIUS, length / 2) / (length || 1);
      const end = { x: to.x - (to.x - from.x) * cut, y: to.y - (to.y - from.y) * cut };
      return <Arrow key={r.id} points={[from.x, from.y, end.x, end.y]}
        stroke={r.changed ? ROUTE_COLOURS[kind] : colorPalette.grey} fill={r.changed ? ROUTE_COLOURS[kind] : colorPalette.grey}
        strokeWidth={r.changed ? 2 : 1.5} pointerLength={r.changed ? 6 : 5} pointerWidth={r.changed ? 6 : 5}
        opacity={r.changed ? 0.85 : 0.5} perfectDrawEnabled={false}/>;
    })}
  </Layer>;
});

export default PreviewRoutesLayer;
