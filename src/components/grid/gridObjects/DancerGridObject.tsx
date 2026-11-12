import { Circle, Text } from "react-konva";
import { formatDancerName } from "../../../lib/helpers/dancerNameHelper";
import { Dancer, DancerPosition } from "../../../models/dancer";
import { StageGeometry } from "../../../models/choreo";
import BaseGridObject from "./BaseGridObject";
import Konva from "konva";
import { colorPalette } from "../../../lib/consts/colors";
import { DancerDisplayType } from "../../../models/appSettings";
import { METER_PX } from "../../../lib/consts/consts";
import { memo } from "react";
import StackBadge from "./StackBadge";
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
  // On the top member of a stack: show the layers mark (red: a hidden member is selected),
  // and a dashed ring when a hidden member is selected but this top one isn't.
  stackMark?: "normal" | "red",
  hiddenSelected?: boolean,
  stackCount?: number,
  onDragFollow?: (id: string, phase: "start" | "move" | "end" | "cancel", dx?: number, dy?: number) => void,
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
  stackMark,
  hiddenSelected,
  stackCount,
  onDragFollow,
}: DancerGridObjectProps) {
  const ringRadius = METER_PX * (dancerDisplayType === "large" ? 0.6 : 0.3);
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
        onDragFollow={onDragFollow}
      >
        {
          hiddenSelected && !isSelected &&
          <Circle radius={ringRadius} fill={colorPalette.white} strokeEnabled strokeWidth={3} stroke={colorPalette.primary} dash={[5, 4]}/>
        }
        {
          isSelected && 
          <Circle
            radius={ringRadius}
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
            y={-METER_PX*0.4}
            width={METER_PX}
            height={METER_PX*0.8}
            verticalAlign="middle"
            align="center"
            text={formatDancerName(dancer.name)}
            fontFamily="'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif"
            fontSize={METER_PX/3.5}
            fontStyle="bold"
            fill={colorPalette.getTextColor(position.color) ?? "white"}
          />
        }
        {
          stackMark && stackCount !== undefined &&
          <StackBadge x={ringRadius * 0.75} y={-ringRadius * 0.75} radius={METER_PX * 0.22} red={stackMark === "red"} count={stackCount}/>
        }
      </BaseGridObject>
    }
  </>
});

export default DancerGridObject;
