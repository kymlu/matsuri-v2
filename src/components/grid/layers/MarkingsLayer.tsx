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

    const totalWidthMeters = margins.leftMargin + width + margins.rightMargin;
    const totalWidthPx = totalWidthMeters * gridSizePx;
    const totalHeightPx = (margins.topMargin + length + margins.bottomMargin) * gridSizePx;
    
    const stageTopPx = margins.topMargin * gridSizePx;
    
    const center = width / 2;
    
    const isOddTotal = totalWidthMeters % 2 === 1;
    
    const gridOffsetMeters = isOddTotal ? 0.5 : 0;
    const gridOffsetPx = gridOffsetMeters * gridSizePx;
    
    const newElements = [];

    const pushVerticalElement = (m: number, y: number) => {
      if (y > 0 && y < totalHeightPx) {
        newElements.push(
          <Text
            key={`hr-2-${m}`}
            x={totalWidthPx - gridSizePx * 1.2}
            y={y - 5}
            text={`${m}`}
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

    if (yAxis === "top-down") {
      for (let m = -(margins.topMargin); m <= length + margins.bottomMargin; m++) {
        if (m % verticalGridIncrement !== 0) continue;
        const y = (m + margins.topMargin) * gridSizePx;
        pushVerticalElement(m, y);
      }
    } else {
      for (let m = length + margins.bottomMargin; m >= -(margins.topMargin) ; m--) {
        if (m % verticalGridIncrement !== 0) continue;
        const y = (length + margins.bottomMargin - m) * gridSizePx;
        pushVerticalElement(m, y);
      }
    }
    
    const radius = gridSizePx*0.4;
    const cy = stageTopPx - gridSizePx;

    for (let m = -(margins.leftMargin); m <= width + margins.rightMargin; m++) {
      const meterFromCenter = Math.abs(center - m - gridOffsetMeters);
      const cx = (m + margins.leftMargin) * gridSizePx + gridOffsetPx;

      if (meterFromCenter % 2 !== 0 || meterFromCenter === 0) continue;
      if (cx >= totalWidthPx - gridSizePx * 1.2) continue;
      
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
    setElements(newElements);
  }, [stageGeometry, scale, verticalGridIncrement]);


  return <Layer listening={false}>{elements}</Layer>;
}