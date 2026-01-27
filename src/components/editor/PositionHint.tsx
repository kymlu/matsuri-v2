import { Coordinates } from "../../models/base";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";

export default function PositionHint (props: {
  dancer: Dancer,
  position: DancerPosition,
  nextSectionName: string,
  nextPosition?: DancerPosition,
  action?: DancerAction,
  geometry: StageGeometry,
}) {

  console.log(props.position, props.nextPosition);
  var displayX = "";
  var xFromCenter = props.geometry.stageWidth / 2 - props.position.x;
  if (xFromCenter === 0) {
    displayX = "↔︎0";
  } else if (xFromCenter > 0) {
    displayX = "←" + Math.abs(xFromCenter);
  } else {
    displayX = "→" + Math.abs(xFromCenter);
  }

  var displayY = props.geometry.yAxis === "top-down" ? Math.abs(props.geometry.stageLength - props.position.y) : props.position.y;

  const delta: Coordinates | null = props.nextPosition ? {
    x: props.nextPosition.x - props.position.x,
    y: props.nextPosition.y - props.position.y,
  } : null;

  console.log(delta);

  var deltaString = "";

  if (delta) {
    if (delta.x === 0 && delta.y === 0) {
      deltaString = "なし";
    } else {
      var xMovement: string | null = null;
      var yMovement: string | null = null;
  
      if (delta.y > 0) {
        yMovement = (props.geometry.yAxis === "bottom-up" ? "↑" : "↓") + delta.y + "m"
      } else if (delta.y < 0) {
        yMovement = (props.geometry.yAxis === "bottom-up" ? "↓" : "↑") + delta.y + "m"
      }
  
      if (delta.x > 0) {
        xMovement = `→${delta.x}m`;
      } else if (delta.x < 0) {
        xMovement = `←${Math.abs(delta.x)}m`;
      }

      deltaString = [yMovement, xMovement].join("/")
    }
  }

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
          <span className="font-medium">{displayY}m/{displayX}m</span>
        </div>
        {
          props.nextPosition &&
          <div className="flex justify-between">
            <span className="text-gray-500">次への移動({props.nextSectionName})</span>
            <span className="font-medium">{deltaString}</span>
          </div>
        }
      </div>

      {/* Count / actions */}
      <div className="pt-2 space-y-1 border-t border-gray-200">
        <div className="text-gray-500">カウント</div>
        <div className="flex justify-between pl-2">
          <span>アクション 1</span>
          <span className="font-medium">2と</span>
        </div>
        <div className="flex justify-between pl-2">
          <span>アクション 2</span>
          <span className="font-medium">5</span>
        </div>
      </div>
    </div>
  );
} 