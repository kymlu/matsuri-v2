import { Rect, Text } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { Prop, PropPosition } from "../../../models/prop";

export default function PropGridObject (props: {
  prop: Prop,
  position: PropPosition,
  stageGeometry: StageGeometry,
  updatePosition?: (x: number, y: number) => void,
  onClick: (isAdditive?: boolean) => void,
  isSelected: boolean,
  registerNode: (id: string, node: Konva.Node | null) => void,
  isTransformerActive?: boolean,
  canEdit: boolean,
  snapToGrid?: boolean,
  canSelect: boolean,
}) {
  return <>
    {
      props.prop &&
      <BaseGridObject
        id={props.prop.id}
        draggable={props.canEdit}
        position={props.position}
        onClick={() => {if (props.canSelect) props.onClick()}}
        updatePosition={(x, y) => {props.updatePosition?.(x, y);}}
        stageGeometry={props.stageGeometry}
        isSelected={props.isSelected}
        registerNode={props.registerNode}
        isTransformerActive={props.isTransformerActive}
        snapToGrid={props.snapToGrid}
        rotation={props.position.rotation}
      >
        <Rect
          width={props.prop.width * METER_PX}
          height={props.prop.length * METER_PX}
          fill={props.prop.color}
          strokeEnabled={props.isSelected}
          stroke={colorPalette.primary}/>
        <Text
          y={(props.prop.length / 2) * METER_PX}
          width={props.prop.width * METER_PX}
          height={props.prop.length}
          text={props.prop.name}
          fontSize={METER_PX/2}
          fontStyle="bold"
          fill={colorPalette.getTextColor(props.prop.color) ?? "white"}
          verticalAlign="middle"
          align="center" />
      </BaseGridObject>
    }
  </>
}