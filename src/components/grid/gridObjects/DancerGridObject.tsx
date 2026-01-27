import { Circle, Text } from "react-konva";
import { Dancer, DancerPosition } from "../../../models/dancer";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";

export default function DancerGridObject (props: {
  dancer: Dancer,
  position: DancerPosition,
  stageGeometry: StageGeometry,
  updatePosition?: (x: number, y: number) => void,
  onClick: (isAdditive?: boolean) => void,
  isSelected: boolean,
  registerNode: (id: string, node: Konva.Node | null) => void,
  isTransformerActive?: boolean,
  canEdit: boolean,
}) {
  return <>
    {
      props.dancer &&
      <BaseGridObject
        id={props.dancer.id}
        draggable={props.canEdit}
        position={props.position}
        onClick={props.onClick}
        updatePosition={(x, y) => {console.log(x, y); props.updatePosition?.(x, y);}}
        stageGeometry={props.stageGeometry}
        isSelected={props.isSelected}
        registerNode={props.registerNode}
        isTransformerActive={props.isTransformerActive}
      >
        <Circle
          radius={6}
          fill="black"
          strokeEnabled={props.isSelected}
          stroke={colorPalette.primary}
        />

        <Text
          listening={false}
          text={props.dancer.name}
          fontSize={12}
          fill="black"
          offsetY={16}
          offsetX={props.dancer.name.length * 3}
        />
      </BaseGridObject>
    }
  </>
}