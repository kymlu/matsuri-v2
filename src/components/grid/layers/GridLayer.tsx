import { Circle, Group, Layer, Line, Rect, Shape, Text } from "react-konva";
import { StageGeometry, StageMargins, YAxisDirection } from "../../../models/choreo";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { useEffect, useState } from "react";

interface GridLayerProps {
  stageGeometry: StageGeometry,
  gridSize?: number,
  showGridLines: boolean,
  showBorder?: boolean,
}

export default function GridLayer({
  stageGeometry,
  gridSize,
  showGridLines,
  showBorder,
}: GridLayerProps) {
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
    const totalHeightPx =
      (margins.topMargin + length + margins.bottomMargin) * gridSizePx;
    
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
    
    const elements = [];

    // out of bounds area
    elements.push(
      <Rect
        key={"bg-grey"}
        width={totalWidthPx}
        height={totalHeightPx}
        fill={colorPalette.offWhite}
        x={0}
        y={0}
        cornerRadius={METER_PX/2}
        />
    );

    // in bounds area
    elements.push(
      <Rect
        key={"bg-white"}
        x={margins.leftMargin * gridSizePx}
        y={margins.topMargin * gridSizePx}
        width={width * gridSizePx}
        height={length * gridSizePx}
        fill={"white"}
        />
    );
    
    if(showGridLines){
      // Horizontal grid lines
      for (let m = 0; m <= margins.topMargin + length + margins.bottomMargin; m++) {
        const y = m * gridSizePx;
        const isMajor = m % 2 === 0;
      
        if (m > 0 && m < margins.topMargin + length + margins.bottomMargin) {
          elements.push(
            <Line
              key={`h-${m}`}
              points={[0, y, totalWidthPx, y]}
              stroke={colorPalette.lightGrey}
              strokeWidth={1}
              dash={isMajor ? [10, 6] : [4, 6]}
            />
          );
        }
      }

      // Vertical grid lines (across full area)
      for (let m = 0; m < margins.leftMargin + width + margins.rightMargin - gridOffsetMeters; m++) {
        const x = m * gridSizePx + gridOffsetPx;
        
        if (x === 0) continue;
      
        const distFromCenter = Math.abs(
          x - centerX
        ) / gridSizePx;
      
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
    }
    
    // Centre triangle marker
    elements.push(
      <Shape
        key={"triangle"}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(centerX, stageTopPx - gridSizePx * 0.3);
          context.lineTo(centerX - gridSizePx * 0.5, stageTopPx - gridSizePx * 1.2);
          context.lineTo(centerX + gridSizePx * 0.5, stageTopPx - gridSizePx * 1.2);
          context.closePath();
          context.fillStrokeShape(shape);
        }}
        fill={colorPalette.primary}
      />
    )
    
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

    // Draw main stage border
    elements.push(
      <Rect
        key="stage-border"
        x={stageLeftPx}
        y={stageTopPx}
        width={stageWidthPx}
        height={stageHeightPx}
        stroke={colorPalette.primary}
        strokeWidth={2}
      />
    );
    
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
              fontStyle="bold"
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

    if (showBorder) {
      elements.push(
        <Rect
          key={"outline"}
          width={totalWidthPx-2}
          height={totalHeightPx-2}
          x={1}
          y={1}
          cornerRadius={METER_PX/2}
          strokeEnabled
          strokeWidth={1}
          stroke={colorPalette.primary}
          />
      );
    }
    setElements(elements);
  }, [stageGeometry, showGridLines]);


  return <Layer listening={false}>{elements}</Layer>;
}