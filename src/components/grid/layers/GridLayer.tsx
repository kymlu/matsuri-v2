import { Group, Layer, Line, Rect, Shape, Text } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { memo, useEffect, useState } from "react";
import { computeStageGeometryPx, getCentreLabelPositions, getVerticalLabelPositions } from "../../../lib/helpers/stageGridHelper";

interface GridLayerProps {
  stageGeometry: StageGeometry,
  gridSize?: number,
  showGridLines: boolean,
  showBorder?: boolean,
  verticalGridIncrement: number,
}

const GridLayer = memo(function GridLayer({
  stageGeometry,
  gridSize,
  showGridLines,
  showBorder,
  verticalGridIncrement,
}: GridLayerProps) {
  const [elements, setElements] = useState<any[]>([]);
  const gridSizePx = gridSize ?? METER_PX;

  useEffect(() => {
    const geometry = computeStageGeometryPx(stageGeometry, gridSizePx);
    const {
      width, length, margins,
      stageWidthPx, stageHeightPx,
      totalWidthPx, totalHeightPx,
      stageLeftPx, stageTopPx,
      centerX, gridOffsetMeters, gridOffsetPx,
    } = geometry;

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
        fill={colorPalette.white}
        />
    );
    
    if (showGridLines){
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
          stroke={colorPalette.midGrey}
          strokeWidth={1.2}
          dash={[10, 6]}
        />
      );
    }

    // Draw main stage border
    elements.push(
      <Rect
        key="stage-border"
        x={stageLeftPx}
        y={stageTopPx}
        width={stageWidthPx}
        height={stageHeightPx}
        stroke={colorPalette.grey}
        strokeWidth={1.2}
      />
    );
    
    // Centre triangle marker
    elements.push(
      <Shape
        key={"triangle"}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(centerX, stageTopPx - gridSizePx * 0.2);
          context.lineTo(centerX - gridSizePx * 0.7, stageTopPx - gridSizePx * 1.2);
          context.lineTo(centerX + gridSizePx * 0.7, stageTopPx - gridSizePx * 1.2);
          context.closePath();
          context.fillStrokeShape(shape);
        }}
        fill={colorPalette.grey}
      />
    )

    elements.push(
      <Text
        key={"frontText"}
        text="前"
        x={centerX - gridSizePx * 0.7}
        y={stageTopPx - gridSizePx}
        width={gridSizePx * 1.4}
        align="center"
        fill={colorPalette.white}
        fontStyle="bold"
        fontSize={12}
      />
    )

    for (const { m, y } of getVerticalLabelPositions(geometry, verticalGridIncrement)) {
      elements.push(
        <Text
          key={`hr-${m}`}
          x={totalWidthPx - gridSizePx * 1.2}
          y={y - 5}
          text={`${m}`}
          fontSize={12}
          align="right"
          width={gridSizePx}
          fontStyle="bold"
          fill={colorPalette.black}
        />
      );
    }

    const radius = gridSizePx*0.4;

    for (const { m, meterFromCenter, cx, cy } of getCentreLabelPositions(geometry)) {
      elements.push(
        <Group key={`vt-${m}`} x={cx} y={cy}>
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
          stroke={colorPalette.grey}
          />
      );
    }
    setElements(elements);
  }, [stageGeometry, showGridLines, verticalGridIncrement]);


  return <Layer listening={false}>{elements}</Layer>;
});

export default GridLayer;