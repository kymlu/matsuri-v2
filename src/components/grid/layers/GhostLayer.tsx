import { Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import { Prop, PropPosition } from "../../../models/prop";
import { colorPalette } from "../../../lib/consts/colors";
import React, { useMemo } from "react";
import { MovementCacheByObjectId, MovementType } from "../../../models/choreoSection";

type GhostLayerProps = {
  dancers: Record<string, Dancer>,
  prevDancerPositions?: Record<string, DancerPosition>,
  dancerMovementCache: MovementCacheByObjectId,
  props: Record<string, Prop>,
  propPositions?: PropPosition[],
  geometry: StageGeometry,
  selectedDancerId?: string,
  isEditingPaths?: boolean
};

export default function GhostLayer({
  dancers,
  prevDancerPositions,
  dancerMovementCache,
  props,
  propPositions,
  geometry,
  selectedDancerId,
  isEditingPaths,
}: GhostLayerProps) {
  const dancerList = useMemo(() => {
    return Object.entries(dancers);
  }, [dancers]);
  return ( 
    <Layer
      listening={false}
      opacity={0.5}
      >
      {/* {
        propPositions &&
        propPositions.map((propPosition) => {
          return (
            <PropGridObject
              key={propPosition.propId}
              prop={props[propPosition.propId]}
              position={propPosition}
              stageGeometry={geometry}
              isSelected={false}
              canEdit={false}
              canSelect={false}
              animate={false}
            />
          );
        })
      } */}
      {
        prevDancerPositions &&
        dancerList.map(([id, dancer]) => <DancerMovement
          key={id}
          prev={prevDancerPositions[id]}
          dancer={dancer}
          geometry={geometry}
          pathPoints={dancerMovementCache?.[id]?.points}
          movementType={dancerMovementCache?.[id]?.tension}
          hidePath={id === selectedDancerId && isEditingPaths === true}
        />)
      }
    </Layer>
  );
}

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
