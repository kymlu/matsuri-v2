import { Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import { colorPalette } from "../../../lib/consts/colors";
import { memo, useMemo } from "react";
import { Movement } from "../../../models/choreoSection";

type GhostLayerProps = {
  dancer: Dancer;
  geometry: StageGeometry
  prevPosition?: DancerPosition;
  movement?: Movement;
  currentPosition?: DancerPosition;
  onMidpointEdit: () => void;
};

const MovementEditLayer = memo(function MovementEditLayer({
  dancer, geometry, prevPosition, currentPosition, movement
}: GhostLayerProps) {
  const points = useMemo(() => {
    if (prevPosition && currentPosition) {
      let midPoints: number[] = [];
      if (movement) {
        midPoints = movement.points.flatMap(p => [p.x, p.y]);
      }
      return [prevPosition.x, prevPosition.y, ...midPoints, currentPosition.x, currentPosition.y]
    } else {
      return [];
    }
  }, [prevPosition, movement, currentPosition]);
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
        />
      }
    </Layer>
  );
});

export default MovementEditLayer;