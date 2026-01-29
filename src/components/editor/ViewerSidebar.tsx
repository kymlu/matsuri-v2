import classNames from "classnames";
import { StageGeometry } from "../../models/choreo";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";
import PositionHint from "./PositionHint";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

export default function ViewerSidebar(props: {
  note?: string,
  showNotes: boolean,
  dancer: Dancer,
  position: DancerPosition,
  nextSectionName?: string,
  nextPosition?: DancerPosition,
  action?: DancerAction,
  geometry: StageGeometry,
  isPositionHintShown: boolean,
  hideNotes: () => void,
  deselectPosition: () => void,
}) {
  var contentClasses = classNames("min-h-0 flex flex-col fixed inset-x-0 bottom-12 h-1/4 max-h-[25%] bg-white p-4 z-20 border-t-2 md:border-t-0 md:static md:bottom-4 md:h-full md:w-1/3 md:max-w-[33vw] md:max-h-full md:border-r-2", {
    "hidden": !props.isPositionHintShown && !props.showNotes
  });
  
  return <div className={contentClasses}>
    {
      <div className="flex items-center self-end justify-between w-full mb-2">
        <span className="text-base font-semibold text-nowrap whitespace-nowrap text-ellipsis">
          {props.isPositionHintShown ? props.dancer.name : "メモ"}
        </span>
        <IconButton
          size="sm"
          src={ICON.clearBlack}
          alt={props.isPositionHintShown ? "Deselect dancer" : "Hide notes"}
          noBorder
          onClick={() => {
            if (props.isPositionHintShown) {
              props.deselectPosition();
            } else {
              props.hideNotes();
            }
          }}
        />
      </div>
    }
    <div className="flex-1 min-h-0 overflow-auto">
      {
        props.showNotes && !props.isPositionHintShown &&
        <p className="break-words whitespace-pre-line text-wrap">
          {isNullOrUndefinedOrBlank(props.note) ? "メモなし" : props.note}
        </p>
      }
      {
        props.isPositionHintShown &&
        <PositionHint
          dancer={props.dancer}
          position={props.position}
          nextSectionName={props.nextSectionName}
          nextPosition={props.nextPosition}
          action={props.action}
          geometry={props.geometry}
        />
      }
    </div>
  </div>
}