import { Circle } from "react-konva";
import { DancerPosition } from "../../../models/dancer";
import { StageGeometry } from "../../../models/choreo";
import { METER_PX } from "../../../lib/consts/consts";
import React, { useMemo } from "react";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { colorPalette } from "../../../lib/consts/colors";

type BasicDancerGridObjectProps = {
  prev?: DancerPosition,
  geometry?: StageGeometry,
  hasOutline?: boolean,
}

const BasicDancerGridObject = React.memo(function BasicDancerGridObject ({
  prev, geometry, hasOutline = false
}: BasicDancerGridObjectProps) {
  const coords = useMemo(() => {
    if (prev) {
      if (geometry) {
        return stageMetersToPx(prev, geometry, METER_PX);
      } else {
        return prev;
      }
    }
  }, [prev, geometry]);
  return <>
    {
      prev && coords && <>
        <Circle
          listening={false}
          perfectDrawEnabled={false}
          x={coords.x}
          y={coords.y}
          radius={METER_PX * 0.2}
          fill={prev.color}
          strokeEnabled={hasOutline}
          stroke={colorPalette.white}
          strokeWidth={2}
        />
      </>
    }
  </>
});


export default BasicDancerGridObject;
