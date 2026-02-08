import { useEffect, useState } from "react";
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

  const [deltaString, setDeltaString] = useState<string>("");
  const [currentPositionString, setCurrentPositionString] = useState<string>("");

  useEffect(() => {
    var displayX = "";
    var xFromCenter = geometry.stageWidth / 2 - position.x;
    if (xFromCenter === 0) {
      displayX = "↔︎0";
    } else if (xFromCenter > 0) {
      displayX = "←" + roundToTenth(Math.abs(xFromCenter));
    } else {
      displayX = "→" + roundToTenth(Math.abs(xFromCenter));
    }

    var displayY = position.y;

    setCurrentPositionString(`${displayY}m/${displayX}m`);
    
    const delta: Coordinates | null = nextPosition ? {
      x: nextPosition.x - position.x,
      y: nextPosition.y - position.y,
    } : null;

    if (delta) {
      if (delta.x === 0 && delta.y === 0) {
        setDeltaString("なし");
      } else {
        var xMovement: string | null = null;
        var yMovement: string | null = null;
    
        if (delta.y > 0) {
          yMovement = (geometry.yAxis === "bottom-up" ? "↑" : "↓") + roundToTenth(delta.y) + "m"
        } else if (delta.y < 0) {
          yMovement = (geometry.yAxis === "bottom-up" ? "↓" : "↑") + roundToTenth(Math.abs(delta.y)) + "m"
        }
    
        if (delta.x > 0) {
          xMovement = `→${roundToTenth(delta.x)}m`;
        } else if (delta.x < 0) {
          xMovement = `←${roundToTenth(Math.abs(delta.x))}m`;
        }

        setDeltaString([yMovement, xMovement].filter(x => x !== null).join("/"))
      }
    }
  }, [position, nextPosition]);

  return (
    <div>
      <div className="mb-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">現在</span>
          <span className="font-medium">{currentPositionString}</span>
        </div>
        {
          nextPosition &&
          <div className="flex justify-between">
            <span className="text-gray-500 shrink">次への移動</span>
            <span className="font-medium text-nowrap">{deltaString}</span>
          </div>
        }
      </div>
      {
        actions && actions.length > 0 &&
        <>
          <Divider/>
          <div className="space-y-1 border-gray-200">
            <div className="text-gray-500">カウント</div>
            {
              actions.map(action => {
                var assignedTiming = action.timings.find(t => t.dancerIds.includes(dancer.id));
                
                return <div className="flex justify-between pl-2">
                  <span>{action.name}</span>
                  <span className="font-medium">{assignedTiming?.name ?? "---"}</span>
                </div>
              })
            }
          </div>
        </>
      }
    </div>
  );
} 