import { Arrow, Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import { DancerDisplayType } from "../../../models/appSettings";
import { Prop, PropPosition } from "../../../models/prop";
import PropGridObject from "../gridObjects/PropGridObject";
import { colorPalette } from "../../../lib/consts/colors";
import React, { useMemo } from "react";

type GhostLayerProps = {
  dancers: Record<string, Dancer>,
  prevDancerPositions?: Record<string, DancerPosition>,
  movementCache: Record<string, number[]>,
  props: Record<string, Prop>,
  propPositions?: PropPosition[],
  geometry: StageGeometry,
  selectedDancerId?: string,
};

export default function GhostLayer({
  dancers,
  prevDancerPositions,
  movementCache,
  props,
  propPositions,
  geometry,
  selectedDancerId,
}: GhostLayerProps) {
  const dancerList = useMemo(() => {
    return Object.entries(dancers);
  }, [dancers]);
  return ( 
    <Layer
      listening={false}
      opacity={0.5}
      >
      {
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
      }
      {
        prevDancerPositions &&
        dancerList.map(([id, dancer]) => <DancerMovement
          key={id}
          prev={prevDancerPositions[id]}
          dancer={dancer}
          geometry={geometry}
          pathPoints={movementCache[id]}
          isSelected={id === selectedDancerId}
        />)
      }
    </Layer>
  );
}

type DancerMovementProps = {
  dancer: Dancer,
  prev?: DancerPosition,
  geometry: StageGeometry,
  pathPoints: number[],
  isSelected: boolean,
}

const DancerMovement = React.memo(function DancerMovement ({
  dancer, prev, geometry, pathPoints, isSelected
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
          !isSelected && 
          <Line
            points={pathPoints}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={2}
            fill={colorPalette.primary}
            fillEnabled
            dashEnabled
            pointerWidth={5}
            pointerLength={5}
            dash={[2, 2]}
          />
        }
      </>
    }
  </>
});
