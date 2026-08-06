import { Rect } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { METER_PX } from "../../../lib/consts/consts";
import { Prop, PropPosition } from "../../../models/prop";
import React, { useMemo } from "react";
import { stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";

type BasicPropGridObjectProps = {
  prop: Prop,
  prev?: PropPosition,
  geometry: StageGeometry,
}

const BasicPropGridObject = React.memo(function BasicPropGridObject ({
  prop, prev, geometry
}: BasicPropGridObjectProps) {
  const coords = useMemo(() => {
    if (prev) {
      return stageMetersToPx(prev, geometry, METER_PX);
    }
  }, [prev, geometry]);
  const width = prop.width * METER_PX;
  const length = prop.length * METER_PX;
  
  return <>
    {
      prev && coords && <>
        <Rect
          x={coords.x}
          y={coords.y}
          offset={{x: width / 2, y: length / 2}}
          width={width}
          height={length}
          fill={prop.color}
          stroke={prop.color}
          strokeWidth={1}
          />
      </>
    }
  </>
});

export default BasicPropGridObject;