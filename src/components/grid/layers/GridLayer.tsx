import { Circle, Group, Layer, Line, Rect, Text } from "react-konva";
import { StageGeometry, StageMargins, YAxisDirection } from "../../../models/choreo";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { useEffect, useState } from "react";

interface GridLayerProps {
  stageGeometry: StageGeometry,
}

export default function GridLayer({
  stageGeometry,
}: GridLayerProps) {
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    const width: number = stageGeometry.stageWidth;
    const length: number = stageGeometry.stageLength;
    const margins: StageMargins = stageGeometry.margin;
    const yAxis: YAxisDirection = stageGeometry.yAxis;

    const stageWidthPx = width * METER_PX;
    const stageHeightPx = length * METER_PX;
    
    const totalWidthPx =
      (margins.leftMargin + width + margins.rightMargin) * METER_PX;
    const totalHeightPx =
      (margins.topMargin + length + margins.bottomMargin) * METER_PX;
    
    const stageLeftPx = margins.leftMargin * METER_PX;
    const stageRightPx = stageLeftPx + stageWidthPx;
    const stageTopPx = margins.topMargin * METER_PX;
    const stageBottomPx = stageTopPx + stageHeightPx;
    
    const centerX = stageLeftPx + stageWidthPx / 2;
    
    const totalMeters =
    margins.leftMargin + width + margins.rightMargin;
    
    const isOddTotal = totalMeters % 2 === 1;
    
    const gridOffsetMeters = isOddTotal ? 0.5 : 0;
    const gridOffsetPx = gridOffsetMeters * METER_PX;
    
    const elements = [];

    // out of bounds area
    elements.push(
      <Rect
        key={"bg-grey"}
        width={totalWidthPx}
        height={totalHeightPx}
        fill={colorPalette.offWhite}
        />
    );

    // in bounds area
    elements.push(
      <Rect
        key={"bg-white"}
        x={margins.leftMargin * METER_PX}
        y={margins.topMargin * METER_PX}
        width={width * METER_PX}
        height={length * METER_PX}
        fill={"white"}
        />
    );
    
    // Horizontal grid lines + right labels
    for (let m = 0; m <= margins.topMargin + length + margins.bottomMargin; m++) {
      const y = m * METER_PX;
      const isMajor = m % 2 === 0;
    
      elements.push(
        <Line
          key={`h-${m}`}
          points={[0, y, totalWidthPx, y]}
          stroke={colorPalette.lightGrey}
          strokeWidth={1}
          dash={isMajor ? [10, 6] : [4, 6]}
        />
      );
    
      // Right-side meter labels
      // if stage, 0 at top of stage
      // if parade, 0 at bottom of stage
      if (y >= stageTopPx && y <= stageBottomPx) {
        const meterFromTop =
          yAxis === "top-down" ? 
          (y - stageTopPx) / METER_PX :
          (stageBottomPx - y) / METER_PX;
    
        elements.push(
          <Text
            key={`hr-${m}`}
            x={stageRightPx + 8}
            y={y - 6}
            text={`${meterFromTop}m`}
            fontSize={12}
            fontStyle="bold"
            fill="black"
          />
        );
      }
    }
    
    // Vertical grid lines (across full area)
    for (let m = 0; m <= margins.leftMargin + width + margins.rightMargin; m++) {
      const x = m * METER_PX + gridOffsetPx;
    
      const distFromCenter = Math.abs(
        x - centerX
      ) / METER_PX;
    
      const isMajor = Math.round(distFromCenter) % 2 === 0;
    
      elements.push(
        <Line
          key={`v-${m}`}
          points={[x, 0, x, totalHeightPx]}
          stroke={colorPalette.lightGrey}
          strokeWidth={1}
          dash={
            isMajor ? [10, 6] : [4, 6]
          }
        />
      );
    }
    
    // Center line
    elements.push(
      <Line
        key="center-line"
        points={[centerX, 0, centerX, totalHeightPx]}
        stroke={colorPalette.primary}
        strokeWidth={2}
        dash={[10, 6]}
      />
    );
    
    // Draw main stage border
    elements.push(
      <Line
        key="stage-border"
        points={[
          stageLeftPx,
          stageTopPx,
          stageRightPx,
          stageTopPx,
          stageRightPx,
          stageBottomPx,
          stageLeftPx,
          stageBottomPx,
          stageLeftPx,
          stageTopPx,
        ]}
        stroke={colorPalette.primary}
        strokeWidth={2}
      />
    );
    
    for (let m = 0; m <= margins.leftMargin + width + margins.rightMargin; m++) {
      const x = m * METER_PX + gridOffsetPx;
    
      const isCenter = x === centerX;
      // Top numbering relative to center (stage only)
      if (
        x >= stageLeftPx &&
        x <= stageRightPx &&
        !isCenter
      ) {
        const meterFromCenter =
        Math.abs(x - centerX) / METER_PX;

        if (meterFromCenter % 2 !== 0) continue;
    
        const radius = METER_PX*0.4;
        const cx = x;
        const cy = stageTopPx - 20;
    
        elements.push(
          <Group key={`vt-${m}`} x={cx} y={cy}>
            <Circle
              radius={radius}
              fill={colorPalette.primary}
            />
            <Text
              text={`${meterFromCenter}`}
              fill="white"
              fontSize={12}
              width={radius * 2}
              height={radius * 2}
              offsetX={radius}
              offsetY={radius}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        );
      }
    }
    setElements(elements);
  }, [stageGeometry]);


  return <Layer listening={false}>{elements}</Layer>;
}