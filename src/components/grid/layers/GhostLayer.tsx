import { Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import { Prop, PropPosition } from "../../../models/prop";
import { colorPalette } from "../../../lib/consts/colors";
import React, { useMemo } from "react";
import { MovementCacheByObjectId, MovementType } from "../../../models/choreoSection";
import PropGridObject from "../gridObjects/PropGridObject";

type GhostLayerProps = {
  dancers: Record<string, Dancer>,
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
  dancers,
  prevDancerPositions,
  dancerMovementCache,
  props,
  prevPropPositions,
  propMovementCache,
  geometry,
  selectedId,
  isEditingPaths,
}: GhostLayerProps) {
  const dancerList = useMemo(() => {
    return Object.entries(dancers);
  }, [dancers]);
  const propList = useMemo(() => {
    return Object.entries(props);
  }, [props]);
  return ( 
    <Layer
      listening={false}
      opacity={0.5}
      >
      {
        prevPropPositions &&
        propList.map(([id, prop]) => {
          return (
            <PropMovement
              key={id}
              prop={prop}
              prev={prevPropPositions[id]}
              geometry={geometry}
              pathPoints={propMovementCache?.[id]?.points}
              movementType={propMovementCache?.[id]?.tension}
              hidePath={id === selectedId && isEditingPaths === true}
            />
          );
        })
      }
      {
        prevDancerPositions &&
        dancerList.map(([id, dancer]) => <DancerMovement
          key={id}
          prev={prevDancerPositions[id]}
          dancer={dancer}
          geometry={geometry}
          pathPoints={dancerMovementCache?.[id]?.points}
          movementType={dancerMovementCache?.[id]?.tension}
          hidePath={id === selectedId && isEditingPaths === true}
        />)
      }
    </Layer>
  );
});

export default GhostLayer;

type DancerMovementProps = {
  dancer: Dancer,
  prev?: DancerPosition,
  geometry: StageGeometry,
  pathPoints?: number[],
  movementType?: MovementType
  hidePath: boolean,
}

const DancerMovement = React.memo(function DancerMovement ({
  dancer, prev, geometry, pathPoints, movementType, hidePath
}: DancerMovementProps) {
  return <>
    {
      prev && <>
        <DancerGridObject
          key={dancer.id}
          dancer={{id: dancer.id, name: ""}}
          position={prev}
          stageGeometry={geometry}
          isSelected={false}
          canEdit={false}
          dancerDisplayType={"small"}
          animate={false}
        />
        {
          !hidePath && pathPoints &&
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
            dash={[2, 2]}
            tension={movementType === "straight" ? 0 : 0.5}
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
  return <>
    {
      prev && <>
        <PropGridObject
          key={prop.id}
          prop={{...prop, name: ""}}
          position={prev}
          stageGeometry={geometry}
          isSelected={false}
          canEdit={false}
          animate={false}
          canSelect={false}
        />
        {
          !hidePath && pathPoints &&
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
            dash={[2, 2]}
            tension={movementType === "straight" ? 0 : 0.5}
          />
        }
      </>
    }
  </>
});
