import { Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import { Prop, PropPosition } from "../../../models/prop";
import { colorPalette } from "../../../lib/consts/colors";
import React, { useDeferredValue, useEffect, useMemo, useRef } from "react";
import { MovementCacheByObjectId, MovementType } from "../../../models/choreoSection";
import PropGridObject from "../gridObjects/PropGridObject";
import Konva from "konva";

type GhostLayerProps = {
  dancerIds: string[],
  prevDancerPositions?: Record<string, DancerPosition>,
  dancerMovementCache: MovementCacheByObjectId,
  props: Record<string, Prop>,
  prevPropPositions?: Record<string, PropPosition>,
  propMovementCache: MovementCacheByObjectId,
  geometry: StageGeometry,
  selectedId?: string,
  isEditingPaths?: boolean
};

const GhostLayer = React.memo(function GhostLayer({
  dancerIds,
  prevDancerPositions,
  dancerMovementCache,
  props,
  prevPropPositions,
  propMovementCache,
  geometry,
  selectedId,
  isEditingPaths,
}: GhostLayerProps) {
  const propList = useMemo(() => {
    return Object.entries(props);
  }, [props]);
  const deferredDancerMovementCache = useDeferredValue(dancerMovementCache);
  const deferredPropMovementCache = useDeferredValue(propMovementCache);
  const layerRef = useRef<Konva.Layer>(null);
  useEffect(() => {
  if (layerRef.current) {
    layerRef.current.cache();
  }
}, [deferredDancerMovementCache, deferredPropMovementCache]);
  return ( 
    <Layer
      listening={false}
      opacity={0.5}
      ref={layerRef}
      >
      {
        propList.map(([id, prop]) => {
          const prev = prevPropPositions?.[id];
          if (!prev) return null;

          const cache = deferredPropMovementCache?.[id];
          const isSelected = id === selectedId;
          return (
            <PropMovement
              key={id}
              prop={prop}
              prev={prevPropPositions[id]}
              geometry={geometry}
              pathPoints={cache?.points}
              movementType={cache?.tension}
              hidePath={isSelected && isEditingPaths === true}
            />
          );
        })
      }
      {
        dancerIds.map((id) => {
          const prev = prevDancerPositions?.[id];
          if (!prev) return null;

          const cache = deferredDancerMovementCache?.[id];
          const isSelected = id === selectedId;

          return <DancerMovement
            key={id}
            prev={prevDancerPositions[id]}
            geometry={geometry}
            pathPoints={cache?.points}
            movementType={cache?.tension}
            hidePath={isSelected && isEditingPaths === true}
          />
        })
      }
    </Layer>
  );
});

export default GhostLayer;

type DancerMovementProps = {
  prev?: DancerPosition,
  geometry: StageGeometry,
  pathPoints?: number[],
  movementType?: MovementType
  hidePath: boolean,
}
const PREV_DANCER_BASE = { name: "", id: "" };
const PATH_DASH = [2, 2];

const DancerMovement = React.memo(function DancerMovement ({
  prev, geometry, pathPoints, movementType, hidePath
}: DancerMovementProps) {
  const tension = movementType === "straight" ? 0 : 0.5;
  const showPath = !hidePath && Boolean(pathPoints && pathPoints.length > 0);
  return <>
    {
      prev && <>
        <DancerGridObject
          dancer={PREV_DANCER_BASE}
          position={prev}
          stageGeometry={geometry}
          isSelected={false}
          canEdit={false}
          dancerDisplayType={"small"}
          animate={false}
        />
        {
          showPath &&
          <Line
            points={pathPoints}
            perfectDrawEnabled={false}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={2}
            fill={colorPalette.primary}
            fillEnabled
            dashEnabled
            lineJoin="round"
            pointerWidth={5}
            pointerLength={5}
            dash={PATH_DASH}
            tension={tension}
            listening={false}
          />
        }
      </>
    }
  </>
});

type PropMovementProps = {
  prop: Prop,
  prev?: PropPosition,
  geometry: StageGeometry,
  pathPoints?: number[],
  movementType?: MovementType
  hidePath: boolean,
}

const PropMovement = React.memo(function PropMovement ({
  prop, prev, geometry, pathPoints, movementType, hidePath
}: PropMovementProps) {
  const prevPropObj = useMemo<Prop>(
    () => ({ color: prop.color, name: "", width: prop.width, length: prop.length, id: prop.id }),
    [prop.id, prop.color, prop.width, prop.length]
  );
  const tension = movementType === "straight" ? 0 : 0.5;
  const showPath = !hidePath && Boolean(pathPoints && pathPoints.length > 0);
  return <>
    {
      prev && <>
        <PropGridObject
          prop={prevPropObj}
          position={prev}
          stageGeometry={geometry}
          isSelected={false}
          canEdit={false}
          animate={false}
          canSelect={false}
        />
        {
          showPath &&
          <Line
            points={pathPoints}
            perfectDrawEnabled={false}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={2}
            fill={colorPalette.primary}
            fillEnabled
            dashEnabled
            lineJoin="round"
            pointerWidth={5}
            pointerLength={5}
            dash={PATH_DASH}
            tension={tension}
            listening={false}
          />
        }
      </>
    }
  </>
});
