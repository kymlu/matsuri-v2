import { Arrow, Layer } from "react-konva";
import { DancerPosition } from "../../../models/dancer";
import { colorPalette } from "../../../lib/consts/colors";
import { memo, useMemo } from "react";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { StageGeometry } from "../../../models/choreo";
import { METER_PX } from "../../../lib/consts/consts";
import DancerGridObject from "../gridObjects/DancerGridObject";
import { MovementCacheByObjectId } from "../../../models/choreoSection";

type NextDirectionLayerProps = {
  geometry: StageGeometry
  currentPosition?: DancerPosition,
  nextPosition?: DancerPosition,
  dancerMovementCache?: MovementCacheByObjectId,
}

const NextDirectionLayer = memo(function NextDirectionLayer({
  geometry, currentPosition, nextPosition, dancerMovementCache
}: NextDirectionLayerProps) {
  const hideLayer = useMemo(() => {
    return (!currentPosition ||
      !nextPosition ||
      (currentPosition.x === nextPosition.x && currentPosition.y === nextPosition.y))
  }, [currentPosition, nextPosition]);

  const currentMovement =  useMemo(() => {
    return dancerMovementCache?.[currentPosition!!.dancerId];
  }, [dancerMovementCache, currentPosition]);

  const points = useMemo(() => {
    if (hideLayer) return [];
    if (currentMovement) {
      return currentMovement.points;
    } else {
      const currentPoints = stageMetersToPx(currentPosition!!, geometry, METER_PX);
      const nextPoints = stageMetersToPx(nextPosition!!, geometry, METER_PX);
      return [currentPoints.x, currentPoints.y, nextPoints.x, nextPoints.y]
    }
  }, [currentPosition, nextPosition, currentMovement]);

  return <>
    {
      !hideLayer &&
      <Layer opacity={0.5} listening={false}>
        <DancerGridObject
          dancer={{"id": "", "name": ""}}
          stageGeometry={geometry}
          position={nextPosition!!}
          isSelected={false}
          canEdit={false}
          animate={false}
        />
        <Arrow
          perfectDrawEnabled={false}
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
          tension={currentMovement?.tension === "straight" ? 0 : 0.5}
        />
      </Layer>
    }
  </>
});

export default NextDirectionLayer;