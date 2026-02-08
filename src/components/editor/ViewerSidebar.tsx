import classNames from "classnames";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction";
import PositionHint from "./PositionHint";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import Divider from "../basic/Divider";
import Button from "../basic/Button";
import React from "react";

type ViewerSidebarProps = {
  note?: string;
  showNotes: boolean;
  dancer: Dancer;
  position: DancerPosition;
  nextPosition?: DancerPosition;
  selectedTiming?: string;
  onSelectTiming: (timing?: DancerActionTiming) => void;
  actions?: DancerAction[];
  geometry: StageGeometry;
  isPositionHintShown: boolean;
  hideNotes: () => void;
  deselectPosition: () => void;
};

export default function ViewerSidebar({
  note,
  showNotes,
  dancer,
  position,
  nextPosition,
  selectedTiming,
  onSelectTiming,
  actions,
  geometry,
  isPositionHintShown,
  hideNotes,
  deselectPosition,
}: ViewerSidebarProps) {
  var contentClasses = classNames("min-h-0 flex flex-col fixed inset-x-0 bottom-20 h-[33%] max-h-[33%] bg-white p-4 z-20 border-t-2 md:border-t-0 md:static md:bottom-8 md:h-full md:w-1/3 md:max-w-[33vw] md:max-h-full md:border-r-2", {
    "hidden": !isPositionHintShown && !showNotes
  });
  
  return <div className={contentClasses}>
    {
      <div className="flex items-center self-end justify-between w-full mb-2">
        <span className="text-base font-semibold truncate">
          {isPositionHintShown ? dancer.name : "メモ"}
        </span>
        <IconButton
          size="sm"
          src={ICON.clear}
          noBorder
          onClick={() => {
            if (isPositionHintShown) {
              deselectPosition();
            } else if (selectedTiming) {
              onSelectTiming();
            } else {
              hideNotes();
            }
          }}
        />
      </div>
    }
    {/* todo: add buttons to highlight which dancers are at which count */}
    <div className="flex-1 min-h-0 overflow-auto">
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
        isPositionHintShown && showNotes &&
        <Divider/>
      }
      {
        actions && actions.length > 0 && !isPositionHintShown && 
        <div className="grid grid-cols-[1fr,3fr] items-start gap-2">
          {
            actions.map(action => 
              <React.Fragment key={action.id}>
                {action.name}
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
        actions && actions.length > 0 && !isPositionHintShown && showNotes &&
        <Divider/>
      }
      {
        showNotes && isNullOrUndefinedOrBlank(note) &&
        <p className="italic text-gray-500 break-words whitespace-pre-line text-wrap">
          メモなし
        </p>
      }
      {
        showNotes && !isNullOrUndefinedOrBlank(note) &&
        <p className="break-words whitespace-pre-line text-wrap">
          {note}
        </p>
      }
    </div>
  </div>
}