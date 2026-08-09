import { Rect, Text } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX, PATH_DASH } from "../../../lib/consts/consts";
import { Prop, PropPosition } from "../../../models/prop";
import { memo, useEffect, useMemo, useRef } from "react";
import { PathSvgCacheBySectionId } from "../../../models/choreoSection";

type PropGridObjectProps = {
  prop: Prop;
  position: PropPosition;
  stageGeometry: StageGeometry;
  updatePosition?: (x: number, y: number) => void;
  onClick?: (isAdditive?: boolean) => void;
  isSelected: boolean;
  registerNode?: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean;
  canEdit: boolean;
  snapToGrid?: boolean;
  canSelect: boolean;
  sectionId?: string,
  animate: boolean,
  animationCache?: PathSvgCacheBySectionId;
  halfOpacity?: boolean,
  isZooming?: React.RefObject<boolean>;
};

const PropGridObject = memo(function PropGridObject({
  prop,
  position,
  stageGeometry,
  updatePosition,
  onClick,
  isSelected,
  registerNode,
  isTransformerActive,
  canEdit,
  snapToGrid,
  canSelect,
  sectionId,
  animate,
  animationCache,
  halfOpacity,
  isZooming,
}: PropGridObjectProps) {

  const color = useMemo(() => {
    if (prop.color) {
      return position.inUse ? prop.color : colorPalette.lighterColors()[prop.color];
    }
    return colorPalette.rainbow.blue[0];
  }, [position.inUse, prop])

  return <>
    {
      prop &&
      <BaseGridObject
        id={prop.id}
        draggable={canEdit}
        position={position}
        width={prop.width}
        height={prop.length}
        onClick={(isAdditive) => {if (canSelect) onClick?.(isAdditive)}}
        updatePosition={(x, y) => {updatePosition?.(x, y);}}
        stageGeometry={stageGeometry}
        isSelected={isSelected}
        registerNode={registerNode}
        isTransformerActive={isTransformerActive}
        snapToGrid={snapToGrid}
        rotation={position.rotation}
        animate={animate}
        isZooming={isZooming}
        sectionId={sectionId}
        halfOpacity={halfOpacity}
        animationCache={animationCache}
      >
        <Rect
          x={METER_PX*-0.15}
          y={METER_PX*-0.15}
          width={(prop.width + 0.3) * METER_PX}
          height={(prop.length + 0.3) * METER_PX}
          visible={isSelected}
          strokeWidth={3}
          stroke={colorPalette.primary}
          fill={colorPalette.white}
        />
        
        <Rect
          width={(prop.width * METER_PX)}
          height={(prop.length * METER_PX)}
          fill={color}
          stroke={prop.color}
          dash={!position.inUse ? [4, 4] : []}
          strokeWidth={!position.inUse ? 4 : 1}
          />

        <Text
          y={(prop.length / 2) * METER_PX}
          width={prop.width * METER_PX}
          height={prop.length}
          text={prop.name}
          opacity={position.inUse ? 1 : 1}
          fontSize={METER_PX/3}
          fontStyle="bold"
          fill={colorPalette.getTextColor(color) ?? "white"}
          verticalAlign="middle"
          align="center" />
      </BaseGridObject>
    }
  </>
});

export default PropGridObject;
