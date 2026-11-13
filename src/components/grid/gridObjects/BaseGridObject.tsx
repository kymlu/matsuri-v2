import { memo, ReactNode, useEffect, useRef, useState } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { Stage } from "konva/lib/Stage";
import { METER_PX } from "../../../lib/consts/consts";
import { clampToAnchorRange, cornerToCentre, easeInOut, getAnchorRange, getAnimationKey, pxToStageMeters, snapCoordsToGrid, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
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
  updatePosition?: (x: number, y: number, id: string) => void,
  onClick?: (id: string, isAdditive?: boolean) => void,
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
  // Faint and can't be touched (dancers while focusing on props).
  dimmed?: boolean,
  animationCache?: PathSvgCacheBySectionId;
  // Tells the layer how far this object has been dragged, so it can bring others along live (a stack's other members).
  // "end" gives the final offset after snapping and is followed by the same 1s tween; "cancel" means it didn't move.
  onDragFollow?: (id: string, phase: "start" | "move" | "end" | "cancel", dx?: number, dy?: number) => void;
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
  dimmed,
  animationCache,
  sectionId,
  onDragFollow,
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

  // Stop a running path animation where it is. Path animations move props by their centre (offset = half their
  // size), so put the node back to corner-based coordinates at the same on-screen spot.
  const stopPathAnimation = (node: Konva.Group) => {
    animation.current?.stop();
    const ox = node.offsetX(), oy = node.offsetY();
    if (ox === 0 && oy === 0) return;
    const rad = node.rotation() * Math.PI / 180;
    node.setAttrs({
      x: node.x() - (ox * Math.cos(rad) - oy * Math.sin(rad)),
      y: node.y() - (ox * Math.sin(rad) + oy * Math.cos(rad)),
      offsetX: 0,
      offsetY: 0,
    });
  };

  // A path animation still running when the object is removed would keep calling back into it.
  useEffect(() => () => { animation.current?.stop(); }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Moving already (sections switched mid-move): carry on from where it is without stopping dead first.
    const wasMoving = isAnimating;
    stopPathAnimation(node);
    const newPosition = stageMetersToPx({x: position.x, y: position.y}, stageGeometry, METER_PX, height);
    // Already there to within rounding (e.g. a stack member that followed a drag live): settle exactly.
    // A zero-length tween also replaces any glide still heading somewhere else.
    if (Math.abs(newPosition.x - node.x()) < 0.5 && Math.abs(newPosition.y - node.y()) < 0.5) {
      node.to({ x: newPosition.x, y: newPosition.y, duration: 0, onFinish: () => setIsAnimating(false) });
      return;
    }
    if (animate) setIsAnimating(true);
    const key = sectionId ? getAnimationKey(prevSectionId.current, sectionId) : undefined;
    const cachedPath = key ? animationCache?.[key]?.path : undefined;
    let path: Konva.Path | undefined = cachedPath ? new Konva.Path({x: 0, y: 0, data: cachedPath}) : undefined;
    if (path) {
      // A drawn path starts at the previous section's spot (props: their centre). If the object isn't there,
      // e.g. sections were switched mid-move, playing it would first jump there: glide straight instead.
      const start = path.getPointAtLength(0);
      const here = height && height > 0 && width && width > 0
        ? cornerToCentre(node.x(), node.y(), node.rotation(), width * METER_PX, height * METER_PX, stageGeometry.yAxis)
        : { x: node.x(), y: node.y() };
      if (!start || Math.hypot(start.x - here.x, start.y - here.y) > 2) path = undefined;
    }

    const drawnPath = path;
    if (drawnPath && animate) {
      const pathLen = drawnPath.getLength();
      const duration = 1200;
      const prevRot = prevRotation.current ?? 0;
      const targetRot = rotation ?? 0;
      let offsetX = 0;
      let offsetY = 0;
      if (height && height > 0 && width && width > 0) {
        const centre = cornerToCentre(node.x(), node.y(), node.rotation(), width * METER_PX, height * METER_PX, stageGeometry.yAxis);
        offsetX = width * METER_PX / 2;
        offsetY = height * METER_PX / 2;
        node.setAttrs({
          offsetX,
          offsetY,
          x: centre.x,
          y: centre.y,
        });
      }

      animation.current = new Konva.Animation(function(frame) {
        if (!frame) return;

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
          const pt = drawnPath.getPointAtLength(easedT * pathLen);
          const rot = prevRot + (targetRot - prevRot) * t;
          if (ref.current && pt) {
            ref.current.setAttrs({
              rotation: rot,
              x: pt.x,
              y: pt.y,
            });
          }
        }
      }, node.getLayer());
      animation.current?.start();

    } else {
      // Replaces any glide still running (Konva cancels a tween when a new one takes the same attributes).
      // From rest it eases in and out; if it was already moving it starts at speed and only eases out,
      // so an interrupted move doesn't freeze and then restart slowly.
      node.to({
        x: newPosition.x,
        y: newPosition.y,
        rotation: rotation ?? 0,
        duration: !animate ? 0 : wasMoving ? 0.9 : 1.2,
        easing: wasMoving ? Konva.Easings.EaseOut : Konva.Easings.EaseInOut,
        offsetX: 0,
        offsetY: 0,
        onFinish: () => {setIsAnimating(false)}
      });
    }
    if (sectionId) {
      prevSectionId.current = sectionId;
    }
    prevRotation.current = rotation ?? 0;
  }, [position, stageGeometry, rotation]);

  const snapSize = METER_PX/2;

  // Keeps all of the object within the stage plus its margins, in canvas pixels.
  const clampToStage = (px: Coordinates, rotation: number): Coordinates => {
    const { leftMargin, topMargin } = stageGeometry.margin;
    const range = getAnchorRange(stageGeometry, rotation, width, height);
    const clamped = clampToAnchorRange({ x: px.x / METER_PX - leftMargin, y: px.y / METER_PX - topMargin }, range);
    return { x: (clamped.x + leftMargin) * METER_PX, y: (clamped.y + topMargin) * METER_PX };
  };

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOriginRef = useRef<Coordinates | null>(null);
  
  return (
    <Group
      id={id} 
      ref={ref}
      opacity={dimmed ? 0.2 : halfOpacity ? 0.8 : 1}
      perfectDrawEnabled={false}
      draggable={draggable && !isAnimating}
      listening={dimmed ? false : listening}
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
      onDragStart={() => {
        if (!ref.current) return;
        dragOriginRef.current = { x: ref.current.x(), y: ref.current.y() };
        onDragFollow?.(id, "start");
      }}
      onDragMove={(e) => {
        if (isZooming?.current) return;
        if (!isSelected) {
          onClick?.(id, false);
        }
        
        if (!dragStartRef.current) {
          dragStartRef.current = {
            x: e.target.x(),
            y: e.target.y(),
          };
          isDraggingRef.current = false;
        }

        e.target.position(clampToStage(e.target.position(), e.target.rotation()));

        const dx = e.target.x() - dragStartRef.current.x;
        const dy = e.target.y() - dragStartRef.current.y;

        if (Math.hypot(dx, dy) > 0.01 && !isDraggingRef.current) {
          isDraggingRef.current = true;
        }

        const origin = dragOriginRef.current;
        if (origin) onDragFollow?.(id, "move", e.target.x() - origin.x, e.target.y() - origin.y);
      }}
      onPointerUp={(e) => {
        // Only a press that started on this object counts as a tap. Without this, dropping something
        // onto another object "tapped" the one underneath, added it to the selection and lost the move.
        if (dragStartRef.current && !isDraggingRef.current && !isZooming?.current) {
          onClick?.(id);
        }
        dragStartRef.current = null;
      }}
      onDragEnd={(e) => {
        const origin = dragOriginRef.current;
        dragOriginRef.current = null;
        if (!isDraggingRef.current) {
          onDragFollow?.(id, "cancel");
        } else {
          const node = ref.current!!;

          let position: Coordinates = {x: node.x(), y: node.y()};

          if (snapToGrid) {
            position = clampToStage(snapCoordsToGrid({x: node.x(), y: node.y()}, snapSize), node.rotation());
          }

          if (origin) onDragFollow?.(id, "end", position.x - origin.x, position.y - origin.y);

          node.to({
            x: position.x,
            y: position.y,
            onFinish: () => {
              const snappedPositionInM = pxToStageMeters({x: node.attrs.x, y: node.attrs.y}, stageGeometry, METER_PX, height);
              updatePosition?.(snappedPositionInM.x, snappedPositionInM.y, id);
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
