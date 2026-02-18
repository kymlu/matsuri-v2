import { ReactNode, useEffect, useState } from "react";
import { Coordinates } from "../../models/base";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";
import { roundToTenth } from "../../lib/helpers/globalHelper";
import Divider from "../basic/Divider";

type PositionHintProps = {
  dancer: Dancer;
  position: DancerPosition;
  nextPosition?: DancerPosition;
  actions?: DancerAction[];
  geometry: StageGeometry;
};

export default function PositionHint({
  dancer,
  position,
  nextPosition,
  actions,
  geometry,
}: PositionHintProps) {

  const [currentX, setCurrentX] = useState<number>(0);
  const [currentY, setCurrentY] = useState<number>(0);
  const [deltaX, setDeltaX] = useState<number | undefined>();
  const [deltaY, setDeltaY] = useState<number | undefined>();

  useEffect(() => {
    setCurrentX(roundToTenth(geometry.stageWidth / 2 - position.x));
    setCurrentY(roundToTenth(position.y));
    setDeltaX(nextPosition ? roundToTenth(nextPosition.x) - roundToTenth(position.x) : undefined);
    setDeltaY(nextPosition ? roundToTenth(nextPosition.y) - roundToTenth(position.y) : undefined);
  }, [position, nextPosition]);

  return (
    <div>
      <div className="mb-2 space-y-1">
        <div className="flex w-full gap-2">
          <InfoBox title="現在の位置">
            <span className="font-bold">{currentY}m</span>
            <span className="text-sm text-gray-400">/</span>
            <span>{currentX === 0 ? "↔︎" : currentX > 0 ? "←" : "→"}</span>
            <span className="font-bold">{Math.abs(currentX)}m</span>
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
          <div className="flex flex-wrap w-full gap-2">
            {
              actions.map(action => {
                var assignedTiming = action.timings.find(t => t.dancerIds.includes(dancer.id));
                
                return <InfoBox title={action.name} isSmall>
                  <span className="font-medium">{assignedTiming?.name ?? "---"}</span>
                </InfoBox>
              })
            }
          </div>
        </>
      }
    </div>
  );
}

type InfoBoxProps = {
  title: string,
  children: ReactNode,
  isSmall?: boolean,
}

function InfoBox({title, children, isSmall}: InfoBoxProps) {
  return <div className={"flex flex-col justify-between p-2 border border-gray-300 rounded-md" + (isSmall ? "" : " flex-1")}>
    <span className="text-sm font-semibold text-center text-gray-400">{title}</span>
    <div className="flex items-center justify-center gap-1">
      {children}
    </div>
  </div>
}