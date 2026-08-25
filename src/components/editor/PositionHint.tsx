import { memo, ReactNode } from "react";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";
import { roundToTenth } from "../../lib/helpers/globalHelper";

type PositionHintProps = {
  dancer: Dancer;
  position: DancerPosition;
  nextPosition?: DancerPosition;
  actions?: DancerAction[];
  geometry: StageGeometry;
};

const PositionHint = memo(function PositionHint({
  dancer,
  position,
  nextPosition,
  actions,
  geometry,
}: PositionHintProps) {

  const deltaX = nextPosition ? roundToTenth(roundToTenth(nextPosition.x) - roundToTenth(position.x)) : undefined;
  const deltaY = nextPosition ? roundToTenth(roundToTenth(nextPosition.y) - roundToTenth(position.y)) : undefined;

  return (
    <div>
      <div className="mb-2 space-y-1">
        <div className="flex w-full gap-1">
          <InfoBox title="現在の位置">
            <DancerPositionText position={position} geometry={geometry}/>
          </InfoBox>
          {
            nextPosition && deltaX !== undefined && deltaY !== undefined &&
            <InfoBox title="次への移動">
              <div className="flex items-center justify-center gap-1">
                {
                  deltaX === 0 && deltaY === 0 && <span className="font-bold">なし</span>
                }
                {
                  deltaY !== 0 && 
                  <>
                    <span>
                      {
                        ((deltaY > 0 && geometry.yAxis === "bottom-up") ||
                          (deltaY < 0 && geometry.yAxis === "top-down")) ? 
                        "↑" : "↓"
                      }
                    </span>
                    <span className="font-bold">{Math.abs(deltaY)}m</span>
                  </>
                }
                {
                  deltaX !== 0 && deltaY !== 0 && 
                  <span className="text-sm text-gray-400">/</span>
                }
                {
                  deltaX !== 0 && 
                  <>
                    <span>{deltaX > 0 ? "→" : "←"}</span>
                    <span className="font-bold">{Math.abs(deltaX)}m</span>
                  </>
                }
              </div>
            </InfoBox>
          }
        </div>
      </div>
      {
        actions && actions.length > 0 &&
        <>
          <div className="flex flex-wrap w-full gap-1">
            {
              actions.map(action => {
                const assignedTiming = action.timings.find(t => t.dancerIds.includes(dancer.id));
                
                return <InfoBox key={action.id} title={action.name} isSmall>
                  <span className="font-medium">{assignedTiming?.name ?? "---"}</span>
                </InfoBox>
              })
            }
          </div>
        </>
      }
    </div>
  );
});

export default PositionHint;

type DancerPositionTextProps = {
  position: DancerPosition;
  geometry: StageGeometry;
  bold?: boolean;
};

export function DancerPositionText({ position, geometry, bold = true }: DancerPositionTextProps) {
  const currentX = roundToTenth(geometry.stageWidth / 2 - position.x);
  const currentY = roundToTenth(position.y);
  const valueClasses = bold ? "font-bold" : "font-normal";

  return (
    <div className="flex items-center gap-1">
      <span className={valueClasses}>{currentY}m</span>
      <span className="text-sm text-gray-400">/</span>
      <span>{currentX === 0 ? "↔︎" : currentX > 0 ? "←" : "→"}</span>
      <span className={valueClasses}>{Math.abs(currentX)}m</span>
    </div>
  );
}

type InfoBoxProps = {
  title: string,
  children: ReactNode,
  isSmall?: boolean,
}

function InfoBox({title, children, isSmall}: InfoBoxProps) {
  return <div className={"flex flex-col justify-between p-2 border border-gray-400 rounded-md" + (isSmall ? "" : " flex-1")}>
    <span className="text-sm font-semibold text-center text-gray-600">{title}</span>
    <div className="flex items-center justify-center gap-1">
      {children}
    </div>
  </div>
}