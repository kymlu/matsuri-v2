import { useEffect, useState } from "react";
import { Coordinates } from "../../models/base";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";
import { roundToTenth } from "../../lib/helpers/globalHelper";
import Divider from "../basic/Divider";

export default function PositionHint (props: {
  dancer: Dancer,
  position: DancerPosition,
  nextSectionName?: string,
  nextPosition?: DancerPosition,
  actions?: DancerAction[],
  geometry: StageGeometry,
}) {

  const [deltaString, setDeltaString] = useState<string>("");
  const [currentPositionString, setCurrentPositionString] = useState<string>("");

  useEffect(() => {
    var displayX = "";
    var xFromCenter = props.geometry.stageWidth / 2 - props.position.x;
    if (xFromCenter === 0) {
      displayX = "↔︎0";
    } else if (xFromCenter > 0) {
      displayX = "←" + roundToTenth(Math.abs(xFromCenter));
    } else {
      displayX = "→" + roundToTenth(Math.abs(xFromCenter));
    }

    var displayY = props.position.y;

    setCurrentPositionString(`${displayY}m/${displayX}m`);
    
    const delta: Coordinates | null = props.nextPosition ? {
      x: props.nextPosition.x - props.position.x,
      y: props.nextPosition.y - props.position.y,
    } : null;

    if (delta) {
      if (delta.x === 0 && delta.y === 0) {
        setDeltaString("なし");
      } else {
        var xMovement: string | null = null;
        var yMovement: string | null = null;
    
        if (delta.y > 0) {
          yMovement = (props.geometry.yAxis === "bottom-up" ? "↑" : "↓") + roundToTenth(delta.y) + "m"
        } else if (delta.y < 0) {
          yMovement = (props.geometry.yAxis === "bottom-up" ? "↓" : "↑") + roundToTenth(Math.abs(delta.y)) + "m"
        }
    
        if (delta.x > 0) {
          xMovement = `→${roundToTenth(delta.x)}m`;
        } else if (delta.x < 0) {
          xMovement = `←${roundToTenth(Math.abs(delta.x))}m`;
        }

        setDeltaString([yMovement, xMovement].filter(x => x !== null).join("/"))
      }
    }
  }, [props.position, props.nextPosition]);

  return (
    <div>
      <div className="mb-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">現在</span>
          <span className="font-medium">{currentPositionString}</span>
        </div>
        {
          props.nextPosition &&
          <div className="flex justify-between">
            <span className="text-gray-500 shrink">次への移動</span>
            <span className="font-medium text-nowrap">{deltaString}</span>
          </div>
        }
      </div>
      {
        props.actions && props.actions.length > 0 &&
        <>
          <Divider/>
          <div className="space-y-1 border-gray-200">
            <div className="text-gray-500">カウント</div>
            {
              props.actions.map(action => {
                var assignedTiming = action.timings.find(t => t.dancerIds.includes(props.dancer.id));
                
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