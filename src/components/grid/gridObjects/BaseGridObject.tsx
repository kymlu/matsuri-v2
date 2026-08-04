import { memo, ReactNode, useEffect, useRef, useState } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { Stage } from "konva/lib/Stage";
import { METER_PX } from "../../../lib/consts/consts";
import { cornerToCentre, getAnimationKey, pxToStageMeters, snapCoordsToGrid, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { StageGeometry } from "../../../models/choreo";
import { Coordinates } from "../../../models/base";
import { PathSvgCacheBySectionId } from "../../../models/choreoSection";

export interface BaseGridObjectProps {
  id: string,
  children: ReactNode
  rotation?: number,
  position: Coordinates,
  width?: number,
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
  halfOpacity?: boolean,
  animationCache?: PathSvgCacheBySectionId;
}

const BaseGridObject = memo(function BaseGridObject({
  id,
  children,
  rotation,
  position,
  width, height,
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
  halfOpacity,
  animationCache,
  sectionId,
}: BaseGridObjectProps) {
  const ref = useRef<Konva.Group>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const prevSectionId = useRef<string>("");
  const animation = useRef<Konva.Animation | undefined>(undefined);
  const prevRotation = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    registerNode?.(id, ref.current);
    return () => registerNode?.(id, null);
  }, [id, registerNode]);

  useEffect(() => {
    animation.current?.stop();
    const newPosition = stageMetersToPx({x: position.x, y: position.y}, stageGeometry, METER_PX, height);
    if (newPosition.x === ref.current?.x() && newPosition.y === ref.current?.y()) return;
    if (animate) setIsAnimating(true);
    if (ref.current) {
      const key = sectionId ? getAnimationKey(prevSectionId.current, sectionId) : undefined;
      const cachedPath = key ? animationCache?.[key]?.path : undefined;

      if (cachedPath && animate) {
        let path: Konva.Path = new Konva.Path({x: 0, y: 0, data: cachedPath});
        const pathLen = path.getLength();
        const duration = 1200;
        const prevRot = prevRotation.current ?? 0;
        const targetRot = rotation ?? 0;
        let offsetX = 0;
        let offsetY = 0;
        if (height && height > 0 && width && width > 0) {
          const centre = cornerToCentre(ref.current.x(), ref.current.y(), ref.current.rotation(), width * METER_PX, height * METER_PX, stageGeometry.yAxis);
          offsetX = width * METER_PX / 2;
          offsetY = height * METER_PX / 2;
          ref.current.setAttrs({
            offsetX,
            offsetY,
            x: centre.x,
            y: centre.y,
          });
        }

        animation.current = new Konva.Animation(function(frame) {
          if (!frame) return;
          function easeInOut(t: number): number {
            return t < 0.5 ? 2 * Math.pow(t, 2) : 1 - Math.pow(-2 * t + 2, 2) / 2;
          }

          const elapsed = frame.time; // ms since animation start
          const t = Math.min(elapsed / duration, 1); // 0 to 1

          if (t >= 1) {
            animation.current?.stop();
            ref?.current?.setAttrs({
              rotation: rotation,
              x: newPosition.x,
              y: newPosition.y,
              offsetX: 0,
              offsetY: 0,
            });
            setIsAnimating(false);
          } else {
            const easedT = easeInOut(t);
            const pt = path.getPointAtLength(easedT * pathLen);
            const rot = prevRot + (targetRot - prevRot) * t;
            if (ref.current && pt) {
              ref.current.setAttrs({
                rotation: rot,
                x: pt.x,
                y: pt.y,
              });
            }
          }
        }, ref.current.getLayer());
        animation.current?.start();

      } else {
        animation?.current?.stop();
        ref.current.to({
          x: newPosition.x,
          y: newPosition.y,
          rotation: rotation ?? 0,
          duration: animate ? 1.2 : 0,
          easing: Konva.Easings.EaseInOut,
          offsetX: 0,
          offsetY: 0,
          onFinish: () => {setIsAnimating(false)}
        });
      }
      if (sectionId) {
        prevSectionId.current = sectionId;
      }
      prevRotation.current = rotation ?? 0;
    }
  }, [position, stageGeometry, rotation]);

  const snapSize = METER_PX/2;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  
  return (
    <Group
      id={id} 
      ref={ref}
      opacity={halfOpacity ? 0.8 : 1}
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
