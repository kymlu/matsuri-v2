import { StageGeometry, StageMargins, YAxisDirection } from "../../models/choreo";

/**
 * Shared pixel-space geometry for rendering the stage grid background
 * (GridLayer) and its on-top meter labels (MarkingsLayer).
 */
export type StageGeometryPx = {
  width: number;
  length: number;
  margins: StageMargins;
  yAxis: YAxisDirection;
  gridSizePx: number;
  stageWidthPx: number;
  stageHeightPx: number;
  totalWidthMeters: number;
  totalWidthPx: number;
  totalHeightPx: number;
  stageLeftPx: number;
  stageTopPx: number;
  center: number;
  centerX: number;
  gridOffsetMeters: number;
  gridOffsetPx: number;
};

export function computeStageGeometryPx(stageGeometry: StageGeometry, gridSizePx: number): StageGeometryPx {
  const width = stageGeometry.stageWidth;
  const length = stageGeometry.stageLength;
  const margins = stageGeometry.margin;
  const yAxis = stageGeometry.yAxis;

  const stageWidthPx = width * gridSizePx;
  const stageHeightPx = length * gridSizePx;

  const totalWidthMeters = margins.leftMargin + width + margins.rightMargin;
  const totalWidthPx = totalWidthMeters * gridSizePx;
  const totalHeightPx = (margins.topMargin + length + margins.bottomMargin) * gridSizePx;

  const stageLeftPx = margins.leftMargin * gridSizePx;
  const stageTopPx = margins.topMargin * gridSizePx;

  const center = width / 2;
  const centerX = stageLeftPx + stageWidthPx / 2;

  const isOddTotal = totalWidthMeters % 2 === 1;
  const gridOffsetMeters = isOddTotal ? 0.5 : 0;
  const gridOffsetPx = gridOffsetMeters * gridSizePx;

  return {
    width, length, margins, yAxis, gridSizePx,
    stageWidthPx, stageHeightPx,
    totalWidthMeters, totalWidthPx, totalHeightPx,
    stageLeftPx, stageTopPx,
    center, centerX,
    gridOffsetMeters, gridOffsetPx,
  };
}

export type VerticalLabelPosition = { m: number, y: number };

/** Meter markers running down the front/back (depth) edge of the stage. */
export function getVerticalLabelPositions(geometry: StageGeometryPx, verticalGridIncrement: number): VerticalLabelPosition[] {
  const { margins, length, yAxis, gridSizePx, totalHeightPx } = geometry;
  const positions: VerticalLabelPosition[] = [];

  const pushPosition = (m: number, y: number) => {
    if (y > 0 && y < totalHeightPx) {
      positions.push({ m, y });
    }
  };

  if (yAxis === "top-down") {
    for (let m = -(margins.topMargin); m <= length + margins.bottomMargin; m++) {
      if (m % verticalGridIncrement !== 0) continue;
      pushPosition(m, (m + margins.topMargin) * gridSizePx);
    }
  } else {
    for (let m = length + margins.bottomMargin; m >= -(margins.topMargin); m--) {
      if (m % verticalGridIncrement !== 0) continue;
      pushPosition(m, (length + margins.bottomMargin - m) * gridSizePx);
    }
  }

  return positions;
}

export type CentreLabelPosition = { m: number, meterFromCenter: number, cx: number, cy: number };

/** Meter-from-centre markers running along the left/right (width) edge of the stage. */
export function getCentreLabelPositions(geometry: StageGeometryPx): CentreLabelPosition[] {
  const { margins, width, center, gridOffsetMeters, gridOffsetPx, gridSizePx, stageTopPx, totalWidthPx } = geometry;
  const positions: CentreLabelPosition[] = [];
  const cy = stageTopPx - gridSizePx;

  for (let m = -(margins.leftMargin) + 1; m <= width + margins.rightMargin; m++) {
    const meterFromCenter = Math.abs(center - m - gridOffsetMeters);
    const cx = (m + margins.leftMargin) * gridSizePx + gridOffsetPx;

    if (meterFromCenter % 2 !== 0 || meterFromCenter === 0) continue;
    if (cx >= totalWidthPx - gridSizePx * 1.2) continue;

    positions.push({ m, meterFromCenter, cx, cy });
  }

  return positions;
}
