import { Circle, Group, Layer, Line, Text } from "react-konva";
import { StageMargins, StageType } from "../../models/choreo";
import { colorPalette } from "../../lib/consts/colors";

const METER_PX = 25;

interface GridLayerProps {
  width: number;
  length: number;
  margin: StageMargins;
  stageType: StageType;
}

export default function GridLayer({
  width,
  length,
  margin,
  stageType,
}: GridLayerProps) {
  const stageWidthPx = width * METER_PX;
  const stageHeightPx = length * METER_PX;

  const totalWidthPx =
    (margin.leftMargin + width + margin.rightMargin) * METER_PX;
  const totalHeightPx =
    (margin.topMargin + length + margin.bottomMargin) * METER_PX;

  const stageLeftPx = margin.leftMargin * METER_PX;
  const stageRightPx = stageLeftPx + stageWidthPx;
  const stageTopPx = margin.topMargin * METER_PX;
  const stageBottomPx = stageTopPx + stageHeightPx;

  const centerX = stageLeftPx + stageWidthPx / 2;

  const totalMeters =
  margin.leftMargin + width + margin.rightMargin;

  const isOddTotal = totalMeters % 2 === 1;

  const gridOffsetMeters = isOddTotal ? 0.5 : 0;
  const gridOffsetPx = gridOffsetMeters * METER_PX;

  const elements = [];

  // Horizontal grid lines + right labels
  for (let m = 0; m <= margin.topMargin + length + margin.bottomMargin; m++) {
    const y = m * METER_PX;
    const isMajor = m % 2 === 0;

    elements.push(
      <Line
        key={`h-${m}`}
        points={[0, y, totalWidthPx, y]}
        stroke={colorPalette.palegrey}
        strokeWidth={1}
        dash={isMajor ? [10, 6] : [4, 6]}
      />
    );

    // Right-side meter labels
    // if stage, 0 at top of stage
    // if parade, 0 at bottom of stage
    if (y >= stageTopPx && y <= stageBottomPx) {
      const meterFromTop =
        stageType === "stage" ? 
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
  for (let m = 0; m <= margin.leftMargin + width + margin.rightMargin; m++) {
    const x = m * METER_PX + gridOffsetPx;

    const distFromCenter = Math.abs(
      x - centerX
    ) / METER_PX;

    const isCenter = x === centerX;
    const isMajor = Math.round(distFromCenter) % 2 === 0;

    elements.push(
      <Line
        key={`v-${m}`}
        points={[x, 0, x, totalHeightPx]}
        stroke={colorPalette.palegrey}
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

  for (let m = 0; m <= margin.leftMargin + width + margin.rightMargin; m++) {
    const x = m * METER_PX + gridOffsetPx;

    const distFromCenter = Math.abs(
      x - centerX
    ) / METER_PX;

    const isCenter = x === centerX;
    const isMajor = distFromCenter % 2 === 0;
    // Top numbering relative to center (stage only)
    if (
      x >= stageLeftPx &&
      x <= stageRightPx &&
      !isCenter
    ) {
      const meterFromCenter =
      Math.abs(x - centerX) / METER_PX;

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

  return <Layer listening={false}>{elements}</Layer>;
}