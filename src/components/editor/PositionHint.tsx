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
  // Grey lines for stacks: where they are now (〇〇の上) and what happens next (〇〇から降りる).
  stackNote?: string;
  stackMoveNote?: string;
};

const PositionHint = memo(function PositionHint({
  dancer,
  position,
  nextPosition,
  actions,
  geometry,
  stackNote,
  stackMoveNote,
}: PositionHintProps) {

  const deltaX = nextPosition ? roundToTenth(roundToTenth(nextPosition.x) - roundToTenth(position.x)) : undefined;
  const deltaY = nextPosition ? roundToTenth(roundToTenth(nextPosition.y) - roundToTenth(position.y)) : undefined;

  // With a stack line under one of them, the boxes differ in height: keep both readings level at the top.
  const hasNote = !!stackNote || !!stackMoveNote;

  return (
    <div>
      <div className="mb-2 space-y-1">
        <div className="flex w-full gap-1">
          <InfoBox title="現在の位置" alignTop={hasNote}>
            <DancerPositionText position={position} geometry={geometry}/>
            {stackNote && <Note text={stackNote}/>}
          </InfoBox>
          {
            nextPosition && deltaX !== undefined && deltaY !== undefined &&
            <InfoBox title="次への移動" alignTop={hasNote}>
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
                  <span className="text-sm text-faint">/</span>
                }
                {
                  deltaX !== 0 && 
                  <>
                    <span>{deltaX > 0 ? "→" : "←"}</span>
                    <span className="font-bold">{Math.abs(deltaX)}m</span>
                  </>
                }
              </div>
              {stackMoveNote && <Note text={stackMoveNote}/>}
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
      <span className="text-sm text-faint">/</span>
      <span>{currentX === 0 ? "↔︎" : currentX > 0 ? "←" : "→"}</span>
      <span className={valueClasses}>{Math.abs(currentX)}m</span>
    </div>
  );
}

type InfoBoxProps = {
  title: string,
  children: ReactNode,
  isSmall?: boolean,
  alignTop?: boolean,
}

function InfoBox({title, children, isSmall, alignTop}: InfoBoxProps) {
  return <div className={"flex flex-col p-2 border border-line rounded-md" + (alignTop ? " justify-start" : " justify-between") + (isSmall ? "" : " flex-1")}>
    <span className="text-sm font-semibold text-center text-muted">{title}</span>
    <div className="flex flex-col items-center justify-center">
      {children}
    </div>
  </div>
}

const Note = ({ text }: { text: string }) => <span className="text-sm text-center text-muted">{text}</span>;