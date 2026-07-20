import { Line, Rect, Text } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { Obstacle } from "../../../models/prop";
import { useMemo } from "react";

type ObstacleGridObjectProps = {
  obstacle: Obstacle;
  stageGeometry: StageGeometry;
  updatePosition?: (x: number, y: number) => void;
  onClick?: (isAdditive?: boolean) => void;
  isSelected: boolean;
  areOthersSelected: boolean;
  registerNode?: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean;
  canEdit: boolean;
  snapToGrid?: boolean;
  canSelect: boolean;
  animate: boolean,
  isZooming?: React.RefObject<boolean>;
};

const STRIPES_PER_METRE = 10;

export default function ObstacleGridObject({
  obstacle,
  stageGeometry,
  updatePosition,
  onClick,
  isSelected,
  areOthersSelected,
  registerNode,
  isTransformerActive,
  canEdit,
  snapToGrid,
  canSelect,
  animate,
  isZooming,
}: ObstacleGridObjectProps) {
  const position = useMemo(() => {
    return {x: obstacle.x, y: obstacle.y};
  }, [obstacle.x, obstacle.y]);

  const stripeLines = useMemo(() => {
    const width = obstacle.width * METER_PX;
    const height = obstacle.length * METER_PX;
    const spacing = METER_PX / STRIPES_PER_METRE;

    const dx = width;
    const dy = -height;
    const length = Math.hypot(dx, dy);

    const nx = dy / length;
    const ny = -dx / length;

    const diagLength = Math.hypot(width, height);
    const maxOffset = Math.ceil(diagLength / spacing);

    function clipLine(x0: number, y0: number) {
      const points = [];

      let t, x, y;

      // x = 0
      t = (0 - x0) / dx;
      y = y0 + t * dy;
      if (y >= 0 && y <= height) points.push({ x: 0, y });

      // x = width
      t = (width - x0) / dx;
      y = y0 + t * dy;
      if (y >= 0 && y <= height) points.push({ x: width, y });

      // y = 0
      t = (0 - y0) / dy;
      x = x0 + t * dx;
      if (x >= 0 && x <= width) points.push({ x, y: 0 });

      // y = height
      t = (height - y0) / dy;
      x = x0 + t * dx;
      if (x >= 0 && x <= width) points.push({ x, y: height });

      return points.length === 2 ? points : null;
    }

    return [...Array.from({ length: maxOffset * 2 + 1 }) // ← +1 guarantees center
      .map((_, i) => {
        const offset = (i - maxOffset) * spacing; // 0 will exist

        const x0 = nx * offset;
        const y0 = height + ny * offset;

        const clipped = clipLine(x0, y0);
        if (!clipped) return null;

        return {
          x1: clipped[0].x,
          y1: clipped[0].y,
          x2: clipped[1].x,
          y2: clipped[1].y,
        };
      })
      .filter(Boolean), {x1: 0, y1: obstacle.length * METER_PX, x2: obstacle.width * METER_PX, y2: 0}];
  }, [
    obstacle.width,
    obstacle.length,
  ]);

  return <BaseGridObject
    id={obstacle.id}
    listening={canEdit}
    draggable={canEdit}
    position={position}
    height={obstacle.length}
    onClick={(isAdditive) => {if (canSelect) onClick?.(isAdditive)}}
    updatePosition={(x, y) => {updatePosition?.(x, y);}}
    stageGeometry={stageGeometry}
    isSelected={isSelected}
    areOthersSelected={areOthersSelected}
    registerNode={registerNode}
    isTransformerActive={isTransformerActive}
    snapToGrid={snapToGrid}
    rotation={obstacle.rotation}
    animate={animate}
    isZooming={isZooming}
  >
    <Rect
      width={obstacle.width * METER_PX}
      height={obstacle.length * METER_PX}
      strokeEnabled
      strokeWidth={2.5}
      stroke={isSelected ? colorPalette.primary : obstacle.color}
    />
    
    <Rect
      x={isSelected ? METER_PX * 0.1 : 0}
      y={isSelected ? METER_PX * 0.1 : 0}
      width={(obstacle.width * METER_PX) - (isSelected ? METER_PX * 0.2 : 0)}
      height={(obstacle.length * METER_PX) - (isSelected ? METER_PX * 0.2 : 0)}
      fill="white"
      />

    {
      stripeLines.map((line, index) => (
        line &&
      <Line
        key={index}
        points={[line.x1, line.y1, line.x2, line.y2]}
        stroke={obstacle.color}
        strokeWidth={1.5}
        opacity={1}
      />
      ))
    }
    
    <Text
      y={(obstacle.length / 2) * METER_PX}
      width={obstacle.width * METER_PX}
      height={obstacle.length}
      text={obstacle.name}
      fontSize={METER_PX/3}
      fontStyle="bold"
      fill={colorPalette.black}
      verticalAlign="middle"
      align="center" />
  </BaseGridObject>
}