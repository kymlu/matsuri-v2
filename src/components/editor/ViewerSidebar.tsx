import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction";
import PositionHint from "./PositionHint";
import IconButton from "../basic/IconButton";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import Divider from "../basic/Divider";
import Button from "../basic/Button";
import React, { ReactNode } from "react";
import BottomDrawer from "../basic/BottomDrawer";

type ViewerSidebarProps = {
  note?: string;
  dancer: Dancer;
  position: DancerPosition;
  nextPosition?: DancerPosition;
  selectedTiming?: string;
  onSelectTiming: (timing?: DancerActionTiming) => void;
  actions?: DancerAction[];
  geometry: StageGeometry;
  isPositionHintShown: boolean;
  deselectPosition: () => void;
  formationSelectionToolbar: ReactNode,
};

export default function ViewerSidebar({
  note,
  dancer,
  position,
  nextPosition,
  selectedTiming,
  onSelectTiming,
  actions,
  geometry,
  isPositionHintShown,
  deselectPosition,
  formationSelectionToolbar,
}: ViewerSidebarProps) {
  return <BottomDrawer
    header={
      <div className="flex items-center self-end justify-between w-full mb-2">
        <span className="h-8 text-base font-bold truncate">
          {isPositionHintShown ? dancer.name : "メモ"}
        </span>
        {
          (isPositionHintShown || selectedTiming) && <IconButton
            size="sm"
            src="clear"
            noBorder
            onClick={() => {
              if (isPositionHintShown) {
                deselectPosition();
              } else if (selectedTiming) {
                onSelectTiming();
              }
            }}
          />
        }
      </div>
    }
    footer={formationSelectionToolbar}>
    <>
      {
        isPositionHintShown &&
        <PositionHint
          dancer={dancer}
          position={position}
          nextPosition={nextPosition}
          actions={actions}
          geometry={geometry}
        />
      }
      {
        isPositionHintShown &&
        <Divider/>
      }
      {
        actions && actions.length > 0 && !isPositionHintShown && 
        <div className="grid grid-cols-[2fr,5fr] items-start gap-2">
          {
            actions.map(action => 
              <React.Fragment key={action.id}>
                <span className="mt-1">
                  {action.name}
                </span>
                <div className="flex flex-wrap gap-1">
                  {
                    action.timings.map(timing => 
                      <Button
                        key={timing.id}
                        disabled={timing.dancerIds.length === 0}
                        primary={strEquals(selectedTiming, timing.id)}
                        compact
                        onClick={() => onSelectTiming(strEquals(selectedTiming, timing.id) ? undefined : timing)}
                        >
                        <div className="min-w-6 w-max">
                          {timing.name}
                        </div>
                      </Button>
                    )
                  }
                </div>
              </React.Fragment>
            )
          }
        </div>
      }
      {
        actions && actions.length > 0 && !isPositionHintShown &&
        <Divider/>
      }
      {
        isNullOrUndefinedOrBlank(note) &&
        <p className="italic text-gray-500 break-words whitespace-pre-line text-wrap">
          メモなし
        </p>
      }
      {
        !isNullOrUndefinedOrBlank(note) &&
        <p className="pb-5 break-words whitespace-pre-line text-wrap">
          {note}
        </p>
      }
    </>
  </BottomDrawer>
}