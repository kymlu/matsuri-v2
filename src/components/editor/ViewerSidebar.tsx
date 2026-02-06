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

export default function ViewerSidebar(props: {
  note?: string,
  showNotes: boolean,
  dancer: Dancer,
  position: DancerPosition,
  nextSectionName?: string,
  nextPosition?: DancerPosition,
  selectedTiming?: string,
  onSelectTiming: (timing?: DancerActionTiming) => void,
  actions?: DancerAction[],
  geometry: StageGeometry,
  isPositionHintShown: boolean,
  hideNotes: () => void,
  deselectPosition: () => void,
}) {
  var contentClasses = classNames("min-h-0 flex flex-col fixed inset-x-0 bottom-20 h-[40%] max-h-[40%] bg-white p-4 z-20 border-t-2 md:border-t-0 md:static md:bottom-8 md:h-full md:w-1/3 md:max-w-[33vw] md:max-h-full md:border-r-2", {
    "hidden": !props.isPositionHintShown && !props.showNotes
  });
  
  return <div className={contentClasses}>
    {
      <div className="flex items-center self-end justify-between w-full mb-2">
        <span className="text-base font-semibold truncate">
          {props.isPositionHintShown ? props.dancer.name : "メモ"}
        </span>
        <IconButton
          size="sm"
          src={ICON.clear}
          noBorder
          onClick={() => {
            if (props.isPositionHintShown) {
              props.deselectPosition();
            } else if (props.selectedTiming) {
              props.onSelectTiming();
            } else {
              props.hideNotes();
            }
          }}
        />
      </div>
    }
    {/* todo: add buttons to highlight which dancers are at which count */}
    <div className="flex-1 min-h-0 overflow-auto">
      {
        props.isPositionHintShown &&
        <PositionHint
          dancer={props.dancer}
          position={props.position}
          nextSectionName={props.nextSectionName}
          nextPosition={props.nextPosition}
          actions={props.actions}
          geometry={props.geometry}
        />
      }
      {
        props.isPositionHintShown && props.showNotes &&
        <Divider/>
      }
      {
        props.actions && props.actions.length > 0 && !props.isPositionHintShown && 
        <div className="grid grid-cols-[1fr,3fr] items-start gap-2">
          {
            props.actions.map(action => 
              <React.Fragment key={action.id}>
                {action.name}
                <div className="flex flex-wrap gap-1">
                  {
                    action.timings.map(timing => 
                      <Button
                        key={timing.id}
                        disabled={timing.dancerIds.length === 0}
                        primary={strEquals(props.selectedTiming, timing.id)}
                        compact
                        onClick={() => props.onSelectTiming(strEquals(props.selectedTiming, timing.id) ? undefined : timing)}
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
        props.actions && props.actions.length > 0 && !props.isPositionHintShown && props.showNotes &&
        <Divider/>
      }
      {
        props.showNotes && isNullOrUndefinedOrBlank(props.note) &&
        <p className="italic text-gray-500 break-words whitespace-pre-line text-wrap">
          メモなし
        </p>
      }
      {
        props.showNotes && !isNullOrUndefinedOrBlank(props.note) &&
        <p className="break-words whitespace-pre-line text-wrap">
          {props.note}
        </p>
      }
    </div>
  </div>
}