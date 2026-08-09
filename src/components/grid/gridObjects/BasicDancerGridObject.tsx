import { Circle } from "react-konva";
import { DancerPosition } from "../../../models/dancer";
import { StageGeometry } from "../../../models/choreo";
import { METER_PX } from "../../../lib/consts/consts";
import React, { useMemo } from "react";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { colorPalette } from "../../../lib/consts/colors";

type BasicDancerGridObjectProps = {
  position?: DancerPosition,
  geometry?: StageGeometry,
  hasOutline?: boolean,
}

const BasicDancerGridObject = React.memo(function BasicDancerGridObject ({
  position, geometry, hasOutline = false
}: BasicDancerGridObjectProps) {
  const coords = useMemo(() => {
    if (position) {
      if (geometry) {
        return stageMetersToPx(position, geometry, METER_PX);
      } else {
        return position;
      }
    }
  }, [position, geometry]);
  return <>
    {
      position && coords && <>
        <Circle
          listening={false}
          perfectDrawEnabled={false}
          x={coords.x}
          y={coords.y}
          radius={METER_PX * 0.2}
          fill={position.color}
          strokeEnabled={hasOutline}
          stroke={colorPalette.white}
          strokeWidth={2}
        />
      </>
    }
  </>
});


export default BasicDancerGridObject;
