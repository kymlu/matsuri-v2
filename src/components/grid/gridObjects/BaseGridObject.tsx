import { memo, ReactNode, useEffect, useRef, useState } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { Stage } from "konva/lib/Stage";
import { METER_PX } from "../../../lib/consts/consts";
import { getAnimationKey, pxToStageMeters, snapCoordsToGrid, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { StageGeometry } from "../../../models/choreo";
import { Coordinates } from "../../../models/base";
import { PathSvgCacheBySectionId } from "../../../models/choreoSection";

export interface BaseGridObjectProps {
  id: string,
  children: ReactNode
  rotation?: number,
  position: Coordinates,
  height?: number,
  updatePosition?: (x: number, y: number) => void,
  onClick?: (isAdditive?: boolean) => void,
  draggable?: boolean,
  listening?: boolean,
  onTransform?: (item: Shape<ShapeConfig> | Stage) => void,
  stageGeometry: StageGeometry,
  isSelected: boolean;
  registerNode?: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean,
  snapToGrid?: boolean,
  animate: boolean,
  isZooming?: React.RefObject<boolean>;
  sectionId?: string,
  isEditingOtherMovements?: boolean,
  dancerAnimationCache?: PathSvgCacheBySectionId;
}

const BaseGridObject = memo(function BaseGridObject({
  id,
  children,
  rotation,
  position,
  height,
  updatePosition,
  onClick,
  draggable,
  listening,
  onTransform,
  stageGeometry,
  isSelected,
  registerNode,
  isTransformerActive,
  snapToGrid,
  animate,
  isZooming,
  isEditingOtherMovements,
  dancerAnimationCache,
  sectionId,
}: BaseGridObjectProps) {
  const ref = useRef<Konva.Group>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const prevSectionId = useRef<string>("");

  useEffect(() => {
    registerNode?.(id, ref.current);
    return () => registerNode?.(id, null);
  }, [id, registerNode]);

  useEffect(() => {
    const newPosition = stageMetersToPx({x: position.x, y: position.y}, stageGeometry, METER_PX, height);
    if (newPosition.x === ref.current?.x() && newPosition.y === ref.current?.y()) return;
    if (animate) setIsAnimating(true);
    if (ref.current) {
      if (sectionId && dancerAnimationCache?.[getAnimationKey(prevSectionId.current, sectionId)]) {
        let path: Konva.Path = new Konva.Path({x: 0, y: 0, data: dancerAnimationCache[getAnimationKey(prevSectionId.current, sectionId)].path});
        const steps = 50; // number of steps in animation
        const pathLen = path.getLength();
        const step = pathLen / steps;
        let frameCnt = 0, pos =0, pt;

        let anim = new Konva.Animation(function(frame) {
            pos = pos + 1;
            pt = path.getPointAtLength(pos * step);
            if (ref.current && pt) {
              ref.current.position({x: pt.x, y: pt.y});    
            }
            if (pos == steps) {
              anim.stop();
              ref?.current?.x(newPosition.x);
              ref?.current?.y(newPosition.y);
              ref?.current?.rotation(rotation ?? 0);
              setIsAnimating(false);
            }
        }, ref.current.getLayer());
        anim.start();

      } else {
        ref.current.to({
          x: newPosition.x,
          y: newPosition.y,
          rotation: rotation ?? 0,
          duration: animate ? 1 : 0,
          easing: Konva.Easings.EaseInOut,
          onFinish: () => {setIsAnimating(false)}
        });
      }
      if (sectionId) {
        prevSectionId.current = sectionId;
      }
    }
  }, [position, stageGeometry, rotation]);

  const snapSize = METER_PX/2;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  
  return (
    <Group
      id={id} 
      ref={ref}
      opacity={isEditingOtherMovements ? 0.8 : 1}
      perfectDrawEnabled={false}
      draggable={draggable && !isAnimating}
      listening={listening}
      rotation={0}
      x={0}
      y={0}
      onPointerDown={(e) => {
        if (isZooming?.current) return;
        dragStartRef.current = {
          x: e.target.x(),
          y: e.target.y(),
        };
        isDraggingRef.current = false;
      }}
      onDragMove={(e) => {
        if (isZooming?.current) return;
        if (!isSelected) {
          onClick?.(false);
        }
        
        if (!dragStartRef.current) {
          dragStartRef.current = {
            x: e.target.x(),
            y: e.target.y(),
          };
          isDraggingRef.current = false;
        }

        e.target.x(Math.min(METER_PX * (stageGeometry.stageWidth + stageGeometry.margin.leftMargin + stageGeometry.margin.rightMargin), Math.max(e.target.x(), 0)));
        e.target.y(Math.min(METER_PX * (stageGeometry.stageLength + stageGeometry.margin.topMargin + stageGeometry.margin.bottomMargin), Math.max(e.target.y(), 0)));

        const dx = e.target.x() - dragStartRef.current.x;
        const dy = e.target.y() - dragStartRef.current.y;

        if (Math.hypot(dx, dy) > 0.01 && !isDraggingRef.current) {
          isDraggingRef.current = true;
        }
      }}
      onPointerUp={(e) => {
        if (dragStartRef && !isDraggingRef.current && !isZooming?.current) {
          onClick?.();
        }
      }}
      onDragEnd={(e) => {
        if (isDraggingRef.current) {
          const node = ref.current!!;

          let position: Coordinates = {x: node.x(), y: node.y()};

          if (snapToGrid) {
            position = snapCoordsToGrid({x: node.x(), y: node.y()}, snapSize)
          }

          node.to({
            x: position.x,
            y: position.y,
            onFinish: () => {
              const snappedPositionInM = pxToStageMeters({x: node.attrs.x, y: node.attrs.y}, stageGeometry, METER_PX, height);
              updatePosition?.(snappedPositionInM.x, snappedPositionInM.y);
            }
          });
        }
      }}
      >
      {children}
    </Group>
  )
});

export default BaseGridObject;
