import { Circle, Text } from "react-konva";
import { Dancer, DancerPosition } from "../../../models/dancer";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { DancerDisplayType } from "../../../models/appSettings";
import { METER_PX } from "../../../lib/consts/consts";

type DancerGridObjectProps = {
  dancer: Dancer;
  position: DancerPosition;
  stageGeometry: StageGeometry;
  updatePosition?: (x: number, y: number) => void;
  onClick: (isAdditive?: boolean) => void;
  isSelected: boolean;
  registerNode: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean;
  canEdit: boolean;
  snapToGrid?: boolean;
  dancerDisplayType: DancerDisplayType;
};

export default function DancerGridObject({
  dancer,
  position,
  stageGeometry,
  updatePosition,
  onClick,
  isSelected,
  registerNode,
  isTransformerActive,
  canEdit,
  snapToGrid,
  dancerDisplayType,
}: DancerGridObjectProps) {
  return <>
    {
      dancer &&
      <BaseGridObject
        id={dancer.id}
        draggable={canEdit}
        position={position}
        onClick={onClick}
        updatePosition={(x, y) => {updatePosition?.(x, y);}}
        stageGeometry={stageGeometry}
        isSelected={isSelected}
        registerNode={registerNode}
        isTransformerActive={isTransformerActive}
        snapToGrid={snapToGrid}
      >
        <Circle
          radius={dancerDisplayType === "large" ? METER_PX * 0.45 : METER_PX * 0.2}
          fill={position.color}
          strokeEnabled={isSelected}
          stroke={colorPalette.primary}
        />

        {
          dancerDisplayType === "small" &&
          <Text
            listening={false}
            text={dancer.name}
            fontSize={METER_PX/2}
            fill="black"
            offsetY={METER_PX * 0.7}
            offsetX={dancer.name.length * 3}
          />
        }
        {
          dancerDisplayType === "large" &&
          <Text
            listening={false}
            x={-METER_PX/2}
            y={-METER_PX/2}
            width={METER_PX}
            height={METER_PX}
            verticalAlign="middle"
            align="center"
            text={dancer.name}
            fontSize={METER_PX/2.5}
            fontStyle="bold"
            fill={colorPalette.getTextColor(position.color) ?? "white"}
          />
        }
      </BaseGridObject>
    }
  </>
}