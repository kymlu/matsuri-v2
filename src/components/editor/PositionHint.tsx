import { useEffect, useState } from "react";
import { Coordinates } from "../../models/base";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";
import { roundToTenth } from "../../lib/helpers/globalHelper";

export default function PositionHint (props: {
  dancer: Dancer,
  position: DancerPosition,
  nextSectionName?: string,
  nextPosition?: DancerPosition,
  action?: DancerAction,
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
          xMovement = `→${delta.x}m`;
        } else if (delta.x < 0) {
          xMovement = `←${Math.abs(delta.x)}m`;
        }

        setDeltaString([yMovement, xMovement].filter(x => x !== null).join("/"))
      }
    }
  }, [props.position, props.nextPosition]);

  return (
    <div className="z-10 w-56 p-3 ml-3 text-sm text-gray-800 border rounded-lg shadow-lg border-primary bg-white/90 backdrop-blur">
      {/* Header */}
      <div className="flex pb-1 mb-2 border-b border-gray-200">
        <span className="text-base font-semibold">{props.dancer.name}</span>
      </div>

      {/* Position info */}
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

      {/* Count / actions */}
      {/* <div className="pt-2 space-y-1 border-t border-gray-200">
        <div className="text-gray-500">カウント</div>
        <div className="flex justify-between pl-2">
          <span>アクション 1</span>
          <span className="font-medium">2と</span>
        </div>
        <div className="flex justify-between pl-2">
          <span>アクション 2</span>
          <span className="font-medium">5</span>
        </div>
      </div> */}
    </div>
  );
} 