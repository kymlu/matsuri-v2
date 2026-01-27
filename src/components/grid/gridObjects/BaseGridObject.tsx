import { ReactNode, useEffect, useMemo, useRef } from "react";
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

  useEffect(() => {
    props.registerNode(props.id, ref.current);
    return () => props.registerNode(props.id, null);
  }, [props.id, props.registerNode]);

  const {x, y} = useMemo(() => {
    return stageMetersToPx({x: props.position.x, y: props.position.y}, props.stageGeometry, METER_PX);
  }, [props.position, props.stageGeometry]);

  const snapSize = METER_PX/2;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  
  return (
    <Group
      id={props.id} 
      ref={ref}
      draggable={props.draggable && !props.isTransformerActive}
      rotation={props.rotation ?? 0}
      x={x}
      y={y}
      onPointerDown={(e) => {
        dragStartRef.current = {
          x: e.target.x(),
          y: e.target.y(),
        };
        isDraggingRef.current = false;
      }}
      onDragMove={(e) => {
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
        if (isDraggingRef.current && !props.isTransformerActive) {
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
      // onDragEnd={e => {
      //   const node = e.target;

      //   var snappedPosition = snapToGrid({x: node.x(), y: node.y()}, snapSize);
        
      //   node.to({
      //     x: snappedPosition.x,
      //     y: snappedPosition.y,
      //     onFinish: () => {
      //       props.updatePosition?.(node.attrs.x, node.attrs.y)
      //     }
      //   });
      // }}
      >
      {props.children}
    </Group>
  )
}