import { Arrow, Layer } from "react-konva";
import { DancerPosition } from "../../../models/dancer";
import { colorPalette } from "../../../lib/consts/colors";
import { useMemo } from "react";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { StageGeometry } from "../../../models/choreo";
import { METER_PX } from "../../../lib/consts/consts";
import DancerGridObject from "../gridObjects/DancerGridObject";

type NextDirectionLayerProps = {
  geometry: StageGeometry
  currentPosition?: DancerPosition,
  nextPosition?: DancerPosition,
}

export default function NextDirectionLayer({
  geometry, currentPosition, nextPosition,
}: NextDirectionLayerProps) {
  const hideLayer = useMemo(() => {
    return (!currentPosition ||
      !nextPosition ||
      (currentPosition.x === nextPosition.x && currentPosition.y === nextPosition.y))
  }, [currentPosition, nextPosition]);

  const points = useMemo(() => {
    if (hideLayer) return [];

    var currentPoints = stageMetersToPx(currentPosition!!, geometry, METER_PX);
    var nextPoints = stageMetersToPx(nextPosition!!, geometry, METER_PX);
    return [currentPoints.x, currentPoints.y, nextPoints.x, nextPoints.y]
  }, [currentPosition, nextPosition]);

  return <>
    {
      !hideLayer &&
      <Layer opacity={0.5} listening={false}>
        <DancerGridObject
          dancer={{"id": "", "name": ""}}
          stageGeometry={geometry}
          position={nextPosition!!}
          isSelected={false}
          areOthersSelected={false}
          canEdit={false}
          animate={false}
          isZooming={false}
        />
        <Arrow
          points={points}
          strokeEnabled
          stroke={colorPalette.primary}
          strokeWidth={2}
          fill={colorPalette.primary}
          fillEnabled
          dashEnabled
          dash={[2, 2]}
        />
      </Layer>
    }
  </>
}