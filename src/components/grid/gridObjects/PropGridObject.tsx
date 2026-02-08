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
  onClick: (isAdditive?: boolean) => void;
  isSelected: boolean;
  registerNode: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean;
  canEdit: boolean;
  snapToGrid?: boolean;
  canSelect: boolean;
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
}: PropGridObjectProps) {
  return <>
    {
      prop &&
      <BaseGridObject
        id={prop.id}
        draggable={canEdit}
        position={position}
        onClick={() => {if (canSelect) onClick()}}
        updatePosition={(x, y) => {updatePosition?.(x, y);}}
        stageGeometry={stageGeometry}
        isSelected={isSelected}
        registerNode={registerNode}
        isTransformerActive={isTransformerActive}
        snapToGrid={snapToGrid}
        rotation={position.rotation}
      >
        <Rect
          width={prop.width * METER_PX}
          height={prop.length * METER_PX}
          fill={prop.color}
          strokeEnabled={isSelected}
          stroke={colorPalette.primary}/>
        <Text
          y={(prop.length / 2) * METER_PX}
          width={prop.width * METER_PX}
          height={prop.length}
          text={prop.name}
          fontSize={METER_PX/2}
          fontStyle="bold"
          fill={colorPalette.getTextColor(prop.color) ?? "white"}
          verticalAlign="middle"
          align="center" />
      </BaseGridObject>
    }
  </>
}