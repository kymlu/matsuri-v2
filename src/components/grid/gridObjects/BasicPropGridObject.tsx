import { Rect } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { METER_PX } from "../../../lib/consts/consts";
import { Prop, PropPosition } from "../../../models/prop";
import React, { useMemo } from "react";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { colorPalette } from "../../../lib/consts/colors";

type BasicPropGridObjectProps = {
  prop: Prop,
  prev?: PropPosition,
  geometry: StageGeometry,
  hasOutline?: boolean,
}

const BasicPropGridObject = React.memo(function BasicPropGridObject ({
  prop, prev, geometry, hasOutline = false
}: BasicPropGridObjectProps) {
  const coords = useMemo(() => {
    if (prev) {
      return stageMetersToPx(prev, geometry, METER_PX, prop.length);
    }
  }, [prev, geometry]);
  const width = prop.width * METER_PX;
  const length = prop.length * METER_PX;
  
  return <>
    {
      prev && coords && <>
        <Rect
          listening={false}
          perfectDrawEnabled={false}
          x={coords.x}
          y={coords.y}
          rotation={prev.rotation}
          width={width}
          height={length}
          fill={prev.inUse ? prop.color : colorPalette.lighterColors()[prop.color]}
          stroke={hasOutline ? colorPalette.white : prop.color}
          strokeWidth={2}
          />
      </>
    }
  </>
});

export default BasicPropGridObject;