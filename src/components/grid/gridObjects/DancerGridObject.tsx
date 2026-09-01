import { Circle, Text } from "react-konva";
import { Dancer, DancerPosition } from "../../../models/dancer";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { DancerDisplayType } from "../../../models/appSettings";
import { METER_PX } from "../../../lib/consts/consts";
import { memo } from "react";
import { PathSvgCacheBySectionId } from "../../../models/choreoSection";

type DancerGridObjectProps = {
  dancer: Dancer;
  position: DancerPosition;
  stageGeometry: StageGeometry;
  updatePosition?: (x: number, y: number, id: string) => void;
  onClick?: (id: string, isAdditive?: boolean) => void;
  isSelected: boolean;
  registerNode?: (id: string, node: Konva.Node | null) => void;
  isTransformerActive?: boolean;
  canEdit: boolean;
  snapToGrid?: boolean;
  dancerDisplayType?: DancerDisplayType;
  animate: boolean;
  isZooming?: React.RefObject<boolean>;
  sectionId?: string,
  halfOpacity?: boolean,
  animationCache?: PathSvgCacheBySectionId;
};

const DancerGridObject = memo(function DancerGridObject({
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
  dancerDisplayType = "large",
  animate,
  sectionId,
  isZooming,
  halfOpacity,
  animationCache,
}: DancerGridObjectProps) {
  return <>
    {
      dancer &&
      <BaseGridObject
        id={dancer.id}
        draggable={canEdit}
        position={position}
        onClick={onClick}
        updatePosition={updatePosition}
        stageGeometry={stageGeometry}
        isSelected={isSelected}
        registerNode={registerNode}
        isTransformerActive={isTransformerActive}
        snapToGrid={snapToGrid}
        animate={animate}
        isZooming={isZooming}
        animationCache={animationCache}
        sectionId={sectionId}
        halfOpacity={halfOpacity}
      >
        {
          isSelected && 
          <Circle
            radius={METER_PX * (dancerDisplayType === "large" ?  0.6 : 0.3)}
            fill={colorPalette.white}
            strokeEnabled
            strokeWidth={3}
            stroke={colorPalette.primary}
          />
        }
        <Circle
          radius={METER_PX * (dancerDisplayType === "large" ? 0.45 : 0.2)}
          fill={position.color}
        />

        {
          dancerDisplayType === "small" &&
          <Text
            listening={false}
            text={dancer.name}
            fontSize={METER_PX/2}
            fill={colorPalette.black}
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
            fontSize={METER_PX/3}
            fontStyle="bold"
            fill={colorPalette.getTextColor(position.color) ?? "white"}
          />
        }
      </BaseGridObject>
    }
  </>
});

export default DancerGridObject;
