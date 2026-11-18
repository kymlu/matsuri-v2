import { memo, ReactNode } from "react";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";
import { roundToTenth } from "../../lib/helpers/globalHelper";
import { Tag } from "../common/Tag";

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

  // With a stack line under one of them, the other gets a "-" in its place so both boxes have three lines,
  // and both stay top-aligned so the readings line up.
  const showNext = !!nextPosition && deltaX !== undefined && deltaY !== undefined;
  const hasNote = !!stackNote || (showNext && !!stackMoveNote);

  return (
    <div>
      <div className="mb-2 space-y-1">
        <div className="flex w-full gap-1">
          <InfoBox title="現在の位置" alignTop={hasNote}>
            <DancerPositionText position={position} geometry={geometry}/>
            {hasNote && <Note text={stackNote ?? "-"}/>}
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
              {hasNote && <Note text={stackMoveNote ?? "-"}/>}
            </InfoBox>
          }
        </div>
      </div>
      {
        actions && actions.length > 0 &&
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-sm text-muted">カウント</span>
          {actions.map(action => <ActionCountTag key={action.id} action={action} dancerId={dancer.id}/>)}
        </div>
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

export function ActionCountTag({ action, dancerId }: { action: DancerAction, dancerId: string }) {
  const count = action.timings.find(t => t.dancerIds.includes(dancerId))?.name;

  return <Tag
    type="grey"
    compact
    text={<span className="flex items-baseline gap-0.5">
      <span className="font-normal">{action.name}</span>
      <span className="font-black">{count ?? "-"}</span>
    </span>}
  />;
}

type InfoBoxProps = {
  title: string,
  children: ReactNode,
  alignTop?: boolean,
}

function InfoBox({title, children, alignTop}: InfoBoxProps) {
  return <div className={"flex flex-col p-2 border border-line rounded-md" + (alignTop ? " justify-start" : " justify-between") + " flex-1"}>
    <span className="text-sm font-semibold text-center text-muted">{title}</span>
    <div className="flex flex-col items-center justify-center">
      {children}
    </div>
  </div>
}

const Note = ({ text }: { text: string }) => <span className="text-sm text-center text-muted">{text}</span>;