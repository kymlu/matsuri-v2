import { Coordinates } from "../../models/base";
import { Choreo, StageGeometry } from "../../models/choreo";
import { ChoreoSection, Movement, MovementCache, MovementCacheByObjectId, MovementCacheBySectionIdByObjectId, PathSvgCacheByDancerIdBySectionId } from "../../models/choreoSection";
import { METER_PX } from "../consts/consts";

const MAX_CACHE_SIZE = 1000;
const stageMetersToPxCache = new Map<string, Coordinates>();
const pxToStageMetersCache = new Map<string, Coordinates>();
const pathLineSvgCache = new Map<string, string>();

function getCached<T>(cache: Map<string, T>, key: string, compute: () => T): T {
  if (cache.has(key)) return cache.get(key)!;
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
  const result = compute();
  cache.set(key, result);
  return result;
}

export function stageMetersToPx(
  pos: Coordinates,
  geo: StageGeometry,
  meterPx: number,
  height?: number,
): Coordinates {
  const key = `${pos.x},${pos.y},${geo.stageLength},${geo.yAxis},${geo.margin.leftMargin},${geo.margin.topMargin},${meterPx},${height}`;
  return getCached(stageMetersToPxCache, key, () => {
    const xPx = (geo.margin.leftMargin + pos.x) * meterPx;
    const yStageMeters = geo.yAxis === "top-down"
      ? pos.y
      : (geo.stageLength - pos.y - (height ?? 0));
    const yPx = (geo.margin.topMargin + yStageMeters) * meterPx;
    return { x: xPx, y: yPx };
  });
}

export function pxToStageMeters(
  px: Coordinates,
  geo: StageGeometry,
  meterPx: number,
  height?: number,
): Coordinates {
  const key = `${px.x},${px.y},${geo.stageLength},${geo.yAxis},${geo.margin.leftMargin},${geo.margin.topMargin},${meterPx},${height}`;
  return getCached(pxToStageMetersCache, key, () => {
    const xMeters = px.x / meterPx - geo.margin.leftMargin;
    const yFromTop = px.y / meterPx - geo.margin.topMargin;
    const yMeters = geo.yAxis === "top-down"
      ? yFromTop
      : geo.stageLength - yFromTop - (height ?? 0);
    return { x: xMeters, y: yMeters };
  });
}

export function snapCoordsToGrid(
  pos: Coordinates,
  snapSize: number = 0.5,
): Coordinates {
  return {
    x: Math.round(pos.x / snapSize) * snapSize,
    y: Math.round(pos.y / snapSize) * snapSize,
  }
}

export function getAnimationKey(fromSectionId: string, toSectionId: string): string {
  return `${fromSectionId}-${toSectionId}`;
}

function reversePoints(points: number[]): number[] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push([points[i], points[i + 1]]);
  }
  return pairs.reverse().flat();
}

const createMovementCache = (stageGeometry: StageGeometry, previous: Coordinates, current: Coordinates, movement?: Movement, px: number = METER_PX): MovementCache => {
  const start = stageMetersToPx(previous, stageGeometry, px);
  var movementPoints: number[] = [];
  if (movement) {
    movementPoints = movement.points.map(p => stageMetersToPx(p, stageGeometry, px)).flatMap(p => [p.x, p.y]);
  }
  const end = stageMetersToPx(current, stageGeometry, px);
  return {
    points: [start.x, start.y, ...movementPoints, end.x, end.y],
    tension: movement?.tension ?? "curved"
  } as MovementCache;
}

function getPathLineSvgCached(points: number[], tension = 0.5, closed = false): string {
  const key = `${points.join(",")}|${tension}|${closed}`;
  return getCached(pathLineSvgCache, key, () => getPathLineSvg(points, tension, closed));
}

function getPathLineSvg(points: number[], tension = 0.5, closed = false) {
  if (points.length < 6) {
    // Fallback to straight lines if there aren't enough points for curves
    let path = `M ${points[0]} ${points[1]}`;
    for (let i = 2; i < points.length; i += 2) {
      path += ` L ${points[i]} ${points[i+1]}`;
    }
    if (closed) path += ' Z';
    return path;
  }

  let len = points.length;
  let path = `M ${points[0]} ${points[1]}`;

  // Build a coordinate structure that handles wrapping for closed loops
  let pts = [];
  if (closed) {
    // Add wrapping points to smooth start and end loops seamlessly
    pts.push(points[len - 2], points[len - 1]);
    for (let i = 0; i < len; i++) pts.push(points[i]);
    pts.push(points[0], points[1]);
    pts.push(points[2], points[3]);
  } else {
    // Duplicate edge points to serve as virtual anchors
    pts.push(points[0], points[1]);
    for (let i = 0; i < len; i++) pts.push(points[i]);
    pts.push(points[len - 2], points[len - 1]);
  }

  // Loop through anchors to calculate cubic bezier control coordinates
  // Step through by 2 because array is flat [x, y, x, y]
  let start = closed ? 2 : 2;
  let end = closed ? pts.length - 4 : pts.length - 4;

  for (let i = start; i < end; i += 2) {
    let x0 = pts[i - 2], y0 = pts[i - 1];
    let x1 = pts[i],     y1 = pts[i + 1];
    let x2 = pts[i + 2], y2 = pts[i + 3];
    let x3 = pts[i + 4], y3 = pts[i + 5];

    // Catmull-Rom tangent scalar mapping
    let cp1x = x1 + ((x2 - x0) * tension) / 6;
    let cp1y = y1 + ((y2 - y0) * tension) / 6;
    let cp2x = x2 - ((x3 - x1) * tension) / 6;
    let cp2y = y2 - ((y3 - y1) * tension) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  return path;
}

type PdfPathOp = { op: "m" | "l" | "c" | "h", c: number[] };

// For jspdf
export function getPathLineOps(points: number[], tension = 0.5, closed = false): PdfPathOp[] {
  const ops: PdfPathOp[] = [];

  if (points.length < 6) {
    // Fallback to straight lines if there aren't enough points for curves
    ops.push({ op: "m", c: [points[0], points[1]] });
    for (let i = 2; i < points.length; i += 2) {
      ops.push({ op: "l", c: [points[i], points[i + 1]] });
    }
    if (closed) ops.push({ op: "h", c: [] });
    return ops;
  }

  let len = points.length;
  ops.push({ op: "m", c: [points[0], points[1]] });

  // Build a coordinate structure that handles wrapping for closed loops
  let pts: number[] = [];
  if (closed) {
    // Add wrapping points to smooth start and end loops seamlessly
    pts.push(points[len - 2], points[len - 1]);
    for (let i = 0; i < len; i++) pts.push(points[i]);
    pts.push(points[0], points[1]);
    pts.push(points[2], points[3]);
  } else {
    // Duplicate edge points to serve as virtual anchors
    pts.push(points[0], points[1]);
    for (let i = 0; i < len; i++) pts.push(points[i]);
    pts.push(points[len - 2], points[len - 1]);
  }

  // Loop through anchors to calculate cubic bezier control coordinates
  // Step through by 2 because array is flat [x, y, x, y]
  let start = 2;
  let end = pts.length - 4;

  for (let i = start; i < end; i += 2) {
    let x0 = pts[i - 2], y0 = pts[i - 1];
    let x1 = pts[i],     y1 = pts[i + 1];
    let x2 = pts[i + 2], y2 = pts[i + 3];
    let x3 = pts[i + 4], y3 = pts[i + 5];

    // Catmull-Rom tangent scalar mapping
    let cp1x = x1 + ((x2 - x0) * tension) / 6;
    let cp1y = y1 + ((y2 - y0) * tension) / 6;
    let cp2x = x2 - ((x3 - x1) * tension) / 6;
    let cp2y = y2 - ((y3 - y1) * tension) / 6;

    ops.push({ op: "c", c: [cp1x, cp1y, cp2x, cp2y, x2, y2] });
  }

  if (closed) ops.push({ op: "h", c: [] });

  return ops;
}

export const calculateMovementCache = (choreo: Choreo, showPrev: boolean) => {
  const newMovementCache: MovementCacheBySectionIdByObjectId = {};
  const newAnimationCache: PathSvgCacheByDancerIdBySectionId = {};

  choreo.sections.forEach((s, i) => {
    if ((showPrev && i > 0) || (!showPrev && i < (choreo.sections.length - 1))) {
      let from: ChoreoSection | undefined;
      let to: ChoreoSection | undefined;
      if (showPrev) {
        from = choreo.sections[i - 1];
        to = s;
      } else {
        from = s;
        to = choreo.sections[i + 1];
      }
      const prev = from.formation.dancerPositions;
      const curr = to.formation.dancerPositions;
      const movement = to.formation.dancerMovements;
      const all: MovementCacheByObjectId = {};

      Object.entries(prev).forEach((p) => {
        const [id, position] = p;
        const cache = createMovementCache(
          choreo.stageGeometry,
          position,
          curr[id],
          movement?.[id]
        );
        all[id] = cache;

        const tensionValue = cache.tension === "curved" ? 0.5 : 0;

        // forward: prevSection -> s
        const forwardPath = getPathLineSvgCached(cache.points, tensionValue, false);
        const forwardKey = getAnimationKey(from.id, to.id);

        // backward: s -> prevSection (reverse point order so the tween plays the other way)
        const reversedPoints = reversePoints(cache.points);
        const backwardPath = getPathLineSvgCached(reversedPoints, tensionValue, false);
        const backwardKey = getAnimationKey(to.id, from.id);

        if (!newAnimationCache[id]) {
          newAnimationCache[id] = {};
        }
        newAnimationCache[id][forwardKey] = { path: forwardPath };
        newAnimationCache[id][backwardKey] = { path: backwardPath };
      });

      newMovementCache[showPrev ? to.id : from.id] = all;
    }
  });

  return {newMovementCache, newAnimationCache};
};