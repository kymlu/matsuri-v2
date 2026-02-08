import { ReactNode, useEffect, useRef, useState } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { Stage } from "konva/lib/Stage";
import { METER_PX } from "../../../lib/consts/consts";
import { pxToStageMeters, snapToGrid, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { StageGeometry } from "../../../models/choreo";
import { Coordinates } from "../../../models/base";

export interface BaseGridObjectProps {
  id: string,
  children: ReactNode
  rotation?: number,
  position: Coordinates,
  updatePosition?: (x: number, y: number) => void,
  onClick: (isAdditive?: boolean) => void,
  draggable?: boolean,
  onTransform?: (item: Shape<ShapeConfig> | Stage) => void,
  stageGeometry: StageGeometry,
  isSelected: boolean;
  registerNode: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean,
  snapToGrid?: boolean,
}

export default function BaseGridObject(props: BaseGridObjectProps) {
  const ref = useRef<Konva.Group>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    props.registerNode(props.id, ref.current);
    return () => props.registerNode(props.id, null);
  }, [props.id, props.registerNode]);

  useEffect(() => {
    var newPosition = stageMetersToPx({x: props.position.x, y: props.position.y}, props.stageGeometry, METER_PX);
    if (newPosition.x === ref.current?.x() && newPosition.y === ref.current?.y()) return;
    
    setIsAnimating(true);
    ref.current?.to({
      x: newPosition.x,
      y: newPosition.y,
      rotation: props.rotation ?? 0,
      duration: 1,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {setIsAnimating(false)}
    });
  }, [props.position, props.stageGeometry, props.rotation]);

  const snapSize = METER_PX/2;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  
  return (
    <Group
      id={props.id} 
      ref={ref}
      draggable={props.draggable && !isAnimating}
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
        if (!props.isSelected) {
          props.onClick(false);
        }
        if (isDraggingRef.current) return;
        const start = dragStartRef.current;
        if (!start) return;

        e.target.x(Math.min(METER_PX * (props.stageGeometry.stageWidth + props.stageGeometry.margin.leftMargin + props.stageGeometry.margin.rightMargin), Math.max(e.target.x(), 0)));
        e.target.y(Math.min(METER_PX * (props.stageGeometry.stageLength + props.stageGeometry.margin.topMargin + props.stageGeometry.margin.bottomMargin), Math.max(e.target.y(), 0)));

        const dx = e.target.x() - start.x;
        const dy = e.target.y() - start.y;

        if (Math.hypot(dx, dy) > 0.01) {
          isDraggingRef.current = true;
        }
      }}
      onPointerUp={(e) => {
        if (!isDraggingRef.current) {
          props.onClick();
        }
      }}
      onDragEnd={(e) => {
        if (isDraggingRef.current) {
          const node = ref.current!!;

          var position: Coordinates = {x: node.x(), y: node.y()};

          if (props.snapToGrid) {
            position = snapToGrid({x: node.x(), y: node.y()}, snapSize)
          }

          node.to({
            x: position.x,
            y: position.y,
            onFinish: () => {
              var snappedPositionInM = pxToStageMeters({x: node.attrs.x, y: node.attrs.y}, props.stageGeometry, METER_PX);
              props.updatePosition?.(snappedPositionInM.x, snappedPositionInM.y);
            }
          });

          if (!props.isSelected) {
            props.onClick(false);
          }
        }
      }}
      >
      {props.children}
    </Group>
  )
}