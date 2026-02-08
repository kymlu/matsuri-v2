import { Coordinates } from "../../models/base";
import { StageGeometry } from "../../models/choreo";

export function stageMetersToPx(
  pos: Coordinates,
  geo: StageGeometry,
  meterPx: number,
): Coordinates {
  const xPx =
    (geo.margin.leftMargin + pos.x) * meterPx;

  const yStageMeters =
    geo.yAxis === "top-down"
      ? pos.y
      : geo.stageLength - pos.y;

  const yPx =
    (geo.margin.topMargin + yStageMeters) * meterPx;

  return { x: xPx, y: yPx };
}

export function pxToStageMeters(
  px: Coordinates,
  geo: StageGeometry,
  meterPx: number,
): Coordinates {
  const xMeters =
    px.x / meterPx - geo.margin.leftMargin;

  const yFromTop =
    px.y / meterPx - geo.margin.topMargin;

  const yMeters =
    geo.yAxis === "top-down"
      ? yFromTop
      : geo.stageLength - yFromTop;

  return {
    x: xMeters,
    y: yMeters,
  };
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