import { Group, Layer, Text } from "react-konva";
import { StageGeometry, StageMargins, YAxisDirection } from "../../../models/choreo";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { useEffect, useState } from "react";
import { Coordinates } from "@dnd-kit/utilities";

interface MarkingsLayerProps {
  stageGeometry: StageGeometry,
  gridSize?: number,
  verticalGridIncrement: number,
  scale: Coordinates,
}

export default function MarkingsLayer({
  stageGeometry,
  gridSize,
  verticalGridIncrement,
  scale,
}: MarkingsLayerProps) {
  const [elements, setElements] = useState<any[]>([]);
  const gridSizePx = gridSize ?? METER_PX;

  useEffect(() => {
    const width: number = stageGeometry.stageWidth;
    const length: number = stageGeometry.stageLength;
    const margins: StageMargins = stageGeometry.margin;
    const yAxis: YAxisDirection = stageGeometry.yAxis;

    const stageWidthPx = width * gridSizePx;
    const stageHeightPx = length * gridSizePx;

    const totalWidthPx =
      (margins.leftMargin + width + margins.rightMargin) * gridSizePx;
    
    const stageLeftPx = margins.leftMargin * gridSizePx;
    const stageRightPx = stageLeftPx + stageWidthPx;
    const stageTopPx = margins.topMargin * gridSizePx;
    const stageBottomPx = stageTopPx + stageHeightPx;
    
    const centerX = stageLeftPx + stageWidthPx / 2;
    
    const totalMeters =
    margins.leftMargin + width + margins.rightMargin;
    
    const isOddTotal = totalMeters % 2 === 1;
    
    const gridOffsetMeters = isOddTotal ? 0.5 : 0;
    const gridOffsetPx = gridOffsetMeters * gridSizePx;
    
    const newElements = [];
    
    // Right-side meter labels
    for (let m = 0; m <= margins.topMargin + length + margins.bottomMargin; m++) {
        const y = m * gridSizePx;

      // if stage, 0 at top of stage
      // if parade, 0 at bottom of stage
      if (y >= stageTopPx && y <= stageBottomPx) {
        const meterFromTop =
          yAxis === "top-down" ? 
          (y - stageTopPx) / gridSizePx :
          (stageBottomPx - y) / gridSizePx;

        if (meterFromTop % verticalGridIncrement !== 0 && meterFromTop !== length) continue;
    
        newElements.push(
          <Text
            key={`hr-2-${m}`}
            x={totalWidthPx - gridSizePx * 1.2}
            y={y - 5}
            text={`${meterFromTop}`}
            fontSize={12}
            fontStyle="bold"
            fill={colorPalette.black}
            perfectDrawEnabled={false}
            strokeEnabled
            fillAfterStrokeEnabled
            align="right"
            width={gridSizePx}
            strokeWidth={3}
            stroke="white"
            opacity={0.5}
          />
        );
      }
    }
    
    for (let m = 0; m <= margins.leftMargin + width + margins.rightMargin; m++) {
      const x = m * gridSizePx + gridOffsetPx;
    
      const isCenter = x === centerX;
      // Top numbering relative to center (stage only)
      if (
        x >= stageLeftPx &&
        x <= stageRightPx &&
        !isCenter
      ) {
        const meterFromCenter =
        Math.abs(x - centerX) / gridSizePx;

        if (meterFromCenter % 2 !== 0) continue;
    
        const radius = gridSizePx*0.4;
        const cx = x;
        const cy = stageTopPx - gridSizePx;
    
        newElements.push(
          <Group key={`vt-2-${m}`} x={cx} y={cy}>
            <Text
              text={`${meterFromCenter}`}
              fill={colorPalette.grey}
              fontStyle="bold"
              fontSize={11}
              width={radius * 2}
              offsetX={radius}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        );
      }
    }
    setElements(newElements);
  }, [stageGeometry, scale, verticalGridIncrement]);


  return <Layer listening={false}>{elements}</Layer>;
}