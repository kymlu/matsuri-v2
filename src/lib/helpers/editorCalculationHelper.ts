import { Coordinates } from "../../models/base";
import { StageGeometry } from "../../models/choreo";

const MAX_CACHE_SIZE = 1000;
const stageMetersToPxCache = new Map<string, Coordinates>();
const pxToStageMetersCache = new Map<string, Coordinates>();

function getCached(cache: Map<string, Coordinates>, key: string, compute: () => Coordinates): Coordinates {
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