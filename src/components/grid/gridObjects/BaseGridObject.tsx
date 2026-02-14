import { ReactNode, useEffect, useRef, useState } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { Stage } from "konva/lib/Stage";
import { METER_PX } from "../../../lib/consts/consts";
import { pxToStageMeters, snapCoordsToGrid, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { StageGeometry } from "../../../models/choreo";
import { Coordinates } from "../../../models/base";

export interface BaseGridObjectProps {
  id: string,
  children: ReactNode
  rotation?: number,
  position: Coordinates,
  height?: number,
  updatePosition?: (x: number, y: number) => void,
  onClick?: (isAdditive?: boolean) => void,
  draggable?: boolean,
  onTransform?: (item: Shape<ShapeConfig> | Stage) => void,
  stageGeometry: StageGeometry,
  isSelected: boolean;
  registerNode?: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean,
  snapToGrid?: boolean,
  animate: boolean,
}

export default function BaseGridObject({
  id,
  children,
  rotation,
  position,
  height,
  updatePosition,
  onClick,
  draggable,
  onTransform,
  stageGeometry,
  isSelected,
  registerNode,
  isTransformerActive,
  snapToGrid,
  animate
}: BaseGridObjectProps) {
  const ref = useRef<Konva.Group>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    registerNode?.(id, ref.current);
    return () => registerNode?.(id, null);
  }, [id, registerNode]);

  useEffect(() => {
    var newPosition = stageMetersToPx({x: position.x, y: position.y}, stageGeometry, METER_PX, height);
    if (newPosition.x === ref.current?.x() && newPosition.y === ref.current?.y()) return;

    setIsAnimating(true);
    ref.current?.to({
      x: newPosition.x,
      y: newPosition.y,
      rotation: rotation ?? 0,
      duration: animate ? 1 : 0,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {setIsAnimating(false)}
    });
  }, [position, stageGeometry, rotation]);

  const snapSize = METER_PX/2;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  
  return (
    <Group
      id={id} 
      ref={ref}
      draggable={draggable && !isAnimating}
      rotation={0}
      x={0}
      y={0}
      onPointerDown={(e) => {
        dragStartRef.current = {
          x: e.target.x(),
          y: e.target.y(),
        };
        isDraggingRef.current = false;
      }}
      onDragMove={(e) => {
        if (!isSelected) {
          onClick?.(false);
        }

        const start = dragStartRef.current;
        if (!start) return;

        e.target.x(Math.min(METER_PX * (stageGeometry.stageWidth + stageGeometry.margin.leftMargin + stageGeometry.margin.rightMargin), Math.max(e.target.x(), 0)));
        e.target.y(Math.min(METER_PX * (stageGeometry.stageLength + stageGeometry.margin.topMargin + stageGeometry.margin.bottomMargin), Math.max(e.target.y(), 0)));

        const dx = e.target.x() - start.x;
        const dy = e.target.y() - start.y;

        if (Math.hypot(dx, dy) > 0.01) {
          isDraggingRef.current = true;
        }
      }}
      onPointerUp={(e) => {
        if (!isDraggingRef.current) {
          onClick?.();
        }
      }}
      onDragEnd={(e) => {
        if (isDraggingRef.current) {
          const node = ref.current!!;

          var position: Coordinates = {x: node.x(), y: node.y()};

          if (snapToGrid) {
            position = snapCoordsToGrid({x: node.x(), y: node.y()}, snapSize)
          }

          node.to({
            x: position.x,
            y: position.y,
            onFinish: () => {
              var snappedPositionInM = pxToStageMeters({x: node.attrs.x, y: node.attrs.y}, stageGeometry, METER_PX, height);
              updatePosition?.(snappedPositionInM.x, snappedPositionInM.y);
            }
          });

          if (!isSelected) {
            onClick?.(false);
          }
        }
      }}
      >
      {children}
    </Group>
  )
}