import { Circle, Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { colorPalette } from "../../../lib/consts/colors";
import { memo, useEffect, useMemo, useState } from "react";
import { Movement } from "../../../models/choreoSection";
import { BasePosition, Coordinates } from "../../../models/base";
import { cornerToCentreFromProp, pxToStageMeters, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { METER_PX } from "../../../lib/consts/consts";
import { Prop } from "../../../models/prop";

type GhostLayerProps = {
  geometry: StageGeometry
  prevPosition?: BasePosition;
  movement?: Movement;
  currentPosition?: BasePosition;
  prop?: Prop,
  onMidpointEdit: (newMovement: Movement) => void;
};

const MovementEditLayer = memo(function MovementEditLayer({
  geometry, prevPosition, currentPosition, movement, prop, onMidpointEdit
}: GhostLayerProps) {
  const [midPoints, setMidPoints] = useState<Coordinates[] | undefined>();

  useEffect(() => {
    if (prevPosition && currentPosition) {
      if (movement && movement.points.length > 0) {
        setMidPoints([...movement.points.map(p => stageMetersToPx(p, geometry, METER_PX))]);
      } else {
        let midPoint: Coordinates
        if (prevPosition.type === "prop" && currentPosition.type === "prop" && prop) {
          const prev = cornerToCentreFromProp(prevPosition, prop, geometry.yAxis);
          const curr = cornerToCentreFromProp(currentPosition, prop, geometry.yAxis);
          midPoint = stageMetersToPx({
            x: (curr.x + prev.x) / 2,
            y: (curr.y + prev.y) / 2
          }, geometry, METER_PX);
        } else {
          midPoint = stageMetersToPx({
            x: (currentPosition.x + prevPosition.x) / 2,
            y: (currentPosition.y + prevPosition.y) / 2
          }, geometry, METER_PX);
        }
        setMidPoints([midPoint]);
      }
    } else {
      setMidPoints(undefined);
    }
  }, [movement, prevPosition, currentPosition]);

  const points = useMemo(() => {
    if (prevPosition && currentPosition) {
      let prev: Coordinates;
      let curr: Coordinates;
      if (prevPosition.type === "prop" && currentPosition.type === "prop" && prop) {
        prev = stageMetersToPx(cornerToCentreFromProp(prevPosition, prop, geometry.yAxis), geometry, METER_PX)
        curr = stageMetersToPx(cornerToCentreFromProp(currentPosition, prop, geometry.yAxis), geometry, METER_PX)
      } else {
        prev = stageMetersToPx(prevPosition, geometry, METER_PX)
        curr = stageMetersToPx(currentPosition, geometry, METER_PX)
      }
      return [prev.x, prev.y, ...midPoints?.flatMap((p) => [p.x, p.y]) ?? [], curr.x, curr.y]
    } else {
      return [];
    }
  }, [prop, prevPosition, midPoints, currentPosition]);
  // todo: add dots in the middle that are moveable
  return ( 
    <Layer>
      {
        points.length > 0 && <>
          <Line
            points={points}
            opacity={0.7}
            strokeEnabled
            stroke={colorPalette.white}
            strokeWidth={6}
            fill={colorPalette.white}
            fillEnabled
            lineJoin="round"
            tension={movement?.tension === "straight" ? 0 : 0.5}
          />
          <Line
            points={points}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={3}
            fill={colorPalette.primary}
            fillEnabled
            dashEnabled
            lineJoin="round"
            pointerWidth={5}
            pointerLength={5}
            dash={[2, 2]}
            tension={movement?.tension === "straight" ? 0 : 0.5}
          />
        </>
      }
      {
        midPoints?.map((point, i) => {
          return <Circle
            key={i}
            draggable
            onDragMove={(evt) => {
              const newPoint: Coordinates = {x: evt.currentTarget.x(), y: evt.currentTarget.y()};
              setMidPoints(prev => {
                if (prev) {
                  prev[i] = newPoint;
                  return [...prev];
                }
              })
              midPoints[i].x = evt.currentTarget.x();
              midPoints[i].y = evt.currentTarget.y();
            }}
            onDragEnd={(evt) => {
              onMidpointEdit({points: midPoints.map(p => pxToStageMeters(p, geometry, METER_PX)), tension: movement?.tension ?? "curved"});
            }}
            x={point.x}
            y={point.y}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={2}
            hitStrokeWidth={METER_PX * 0.75}
            fill={colorPalette.white}
            fillEnabled
            radius={METER_PX/5}
          />
        })
      }
    </Layer>
  );
});

export default MovementEditLayer;
