import { Group, Layer, Text } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { memo, useEffect, useState } from "react";
import { Coordinates } from "@dnd-kit/utilities";
import { computeStageGeometryPx, getCentreLabelPositions, getVerticalLabelPositions } from "../../../lib/helpers/stageGridHelper";

interface MarkingsLayerProps {
  stageGeometry: StageGeometry,
  gridSize?: number,
  verticalGridIncrement: number,
  scale: Coordinates,
}

const MarkingsLayer = memo(function MarkingsLayer({
  stageGeometry,
  gridSize,
  verticalGridIncrement,
}: MarkingsLayerProps) {
  const [elements, setElements] = useState<any[]>([]);
  const gridSizePx = gridSize ?? METER_PX;

  useEffect(() => {
    const geometry = computeStageGeometryPx(stageGeometry, gridSizePx);
    const { totalWidthPx } = geometry;

    const newElements = [];

    for (const { m, y } of getVerticalLabelPositions(geometry, verticalGridIncrement)) {
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
          stroke={colorPalette.white}
          opacity={0.5}
        />
      );
    }

    const radius = gridSizePx*0.4;

    for (const { m, meterFromCenter, cx, cy } of getCentreLabelPositions(geometry)) {
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
  }, [stageGeometry, verticalGridIncrement]);


  return <Layer listening={false}>{elements}</Layer>;
});

export default MarkingsLayer;