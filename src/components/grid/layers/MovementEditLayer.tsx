import { Circle, Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import { colorPalette } from "../../../lib/consts/colors";
import { memo, useEffect, useMemo, useState } from "react";
import { Movement } from "../../../models/choreoSection";
import { Coordinates } from "../../../models/base";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { METER_PX } from "../../../lib/consts/consts";

type GhostLayerProps = {
  dancer: Dancer;
  geometry: StageGeometry
  prevPosition?: DancerPosition;
  movement?: Movement;
  currentPosition?: DancerPosition;
  onMidpointEdit: (newMovement: Movement) => void;
};

const MovementEditLayer = memo(function MovementEditLayer({
  dancer, geometry, prevPosition, currentPosition, movement, onMidpointEdit
}: GhostLayerProps) {
  const [midPoints, setMidPoints] = useState<Coordinates[] | undefined>();

  useEffect(() => {
    if (dancer && prevPosition && currentPosition ) {
      if (movement && movement.points.length > 0) {
        setMidPoints([...movement.points]);
      } else {
        const midPoint: Coordinates = stageMetersToPx({
          x: (currentPosition.x + prevPosition.x) / 2,
          y: (currentPosition.y + prevPosition.y) / 2
        }, geometry, METER_PX);
        setMidPoints([midPoint]);
      }
    } else {
      setMidPoints(undefined);
    }
  }, [dancer, movement, prevPosition, currentPosition]);

  const points = useMemo(() => {
    if (prevPosition && currentPosition) {
      const prev = stageMetersToPx(prevPosition, geometry, METER_PX)
      const curr = stageMetersToPx(currentPosition, geometry, METER_PX)
      return [prev.x, prev.y, ...midPoints?.flatMap((p) => [p.x, p.y]) ?? [], curr.x, curr.y]
    } else {
      return [];
    }
  }, [prevPosition, midPoints, currentPosition]);
  // todo: add dots in the middle that are moveable
  return ( 
    <Layer>
      {
        points.length > 0 &&
        <Line
          points={points}
          strokeEnabled
          stroke={colorPalette.primary}
          strokeWidth={2}
          fill={colorPalette.primary}
          fillEnabled
          dashEnabled
          pointerWidth={5}
          pointerLength={5}
          dash={[2, 2]}
          tension={movement?.tension === "straight" ? 0 : 0.5}
        />
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
              onMidpointEdit({points: midPoints, tension: movement?.tension ?? "curved"});
            }}
            x={point.x}
            y={point.y}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={2}
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