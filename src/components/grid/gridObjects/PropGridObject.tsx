import { Rect, Text } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { Prop, PropPosition } from "../../../models/prop";

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
  animate: boolean,
};

export default function PropGridObject({
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
  animate
}: PropGridObjectProps) {
  return <>
    {
      prop &&
      <BaseGridObject
        id={prop.id}
        draggable={canEdit}
        position={position}
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
      >
        <Rect
          width={prop.width * METER_PX}
          height={prop.length * METER_PX}
          strokeEnabled={isSelected}
          strokeWidth={2.5}
          stroke={colorPalette.primary}
        />
        
        <Rect
          x={isSelected ? METER_PX * 0.1 : 0}
          y={isSelected ? METER_PX * 0.1 : 0}
          width={(prop.width * METER_PX) - (isSelected ? METER_PX * 0.2 : 0)}
          height={(prop.length * METER_PX) - (isSelected ? METER_PX * 0.2 : 0)}
          fill={prop.color}/>

        <Text
          y={(prop.length / 2) * METER_PX}
          width={prop.width * METER_PX}
          height={prop.length}
          text={prop.name}
          fontSize={METER_PX/3}
          fontStyle="bold"
          fill={colorPalette.getTextColor(prop.color) ?? "white"}
          verticalAlign="middle"
          align="center" />
      </BaseGridObject>
    }
  </>
}