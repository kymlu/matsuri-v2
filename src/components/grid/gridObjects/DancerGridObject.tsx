import { Circle, Text } from "react-konva";
import { Dancer, DancerPosition } from "../../../models/dancer";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { DancerDisplayType } from "../../../models/appSettings";
import { METER_PX } from "../../../lib/consts/consts";

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
  snapToGrid?: boolean,
  dancerDisplayType: DancerDisplayType,
}) {
  return <>
    {
      props.dancer &&
      <BaseGridObject
        id={props.dancer.id}
        draggable={props.canEdit}
        position={props.position}
        onClick={props.onClick}
        updatePosition={(x, y) => {props.updatePosition?.(x, y);}}
        stageGeometry={props.stageGeometry}
        isSelected={props.isSelected}
        registerNode={props.registerNode}
        isTransformerActive={props.isTransformerActive}
        snapToGrid={props.snapToGrid}
      >
        <Circle
          radius={props.dancerDisplayType === "large" ? METER_PX * 0.45 : METER_PX * 0.2}
          fill={props.position.color}
          strokeEnabled={props.isSelected}
          stroke={colorPalette.primary}
        />

        {
          props.dancerDisplayType === "small" &&
          <Text
            listening={false}
            text={props.dancer.name}
            fontSize={METER_PX/2}
            fill="black"
            offsetY={METER_PX * 0.7}
            offsetX={props.dancer.name.length * 3}
          />
        }
        {
          props.dancerDisplayType === "large" &&
          <Text
            listening={false}
            x={-METER_PX/2}
            y={-METER_PX/2}
            width={METER_PX}
            height={METER_PX}
            verticalAlign="middle"
            align="center"
            text={props.dancer.name}
            fontSize={METER_PX/2.5}
            fontStyle="bold"
            fill={colorPalette.getTextColor(props.position.color) ?? "white"}
          />
        }
      </BaseGridObject>
    }
  </>
}