import { Line, Rect, Text } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { Obstacle } from "../../../models/prop";
import { memo, useCallback, useMemo } from "react";

type ObstacleGridObjectProps = {
  obstacle: Obstacle;
  stageGeometry: StageGeometry;
  updatePosition?: (x: number, y: number, id: string) => void;
  onClick?: (id: string, isAdditive?: boolean) => void;
  isSelected: boolean;
  registerNode?: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean;
  canEdit: boolean;
  snapToGrid?: boolean;
  canSelect: boolean;
  animate: boolean,
  isZooming?: React.RefObject<boolean>;
};

const STRIPES_PER_METRE = 10;

const ObstacleGridObject = memo(function ObstacleGridObject({
  obstacle,
  stageGeometry,
  updatePosition,
  onClick,
  isSelected,
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

  const handleClick = useCallback((id: string, isAdditive?: boolean) => {
    if (canSelect) onClick?.(id, isAdditive);
  }, [canSelect, onClick]);

  return <BaseGridObject
    id={obstacle.id}
    listening={canEdit}
    draggable={canEdit}
    position={position}
    width={obstacle.width}
    height={obstacle.length}
    onClick={handleClick}
    updatePosition={updatePosition}
    stageGeometry={stageGeometry}
    isSelected={isSelected}
    registerNode={registerNode}
    isTransformerActive={isTransformerActive}
    snapToGrid={snapToGrid}
    rotation={obstacle.rotation}
    animate={animate}
    isZooming={isZooming}
  >
    <Rect
      x={METER_PX*-0.15}
      y={METER_PX*-0.15}
      width={(obstacle.width + 0.3) * METER_PX}
      height={(obstacle.length + 0.3) * METER_PX}
      visible={isSelected}
      strokeWidth={3}
      stroke={colorPalette.primary}
      fill={colorPalette.white}
    />

    <Rect
      width={obstacle.width * METER_PX}
      height={obstacle.length * METER_PX}
      strokeWidth={1.5}
      stroke={obstacle.color}
    />
    
    <Rect
      width={(obstacle.width * METER_PX)}
      height={(obstacle.length * METER_PX)}
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
});

export default ObstacleGridObject;