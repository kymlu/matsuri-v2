import { useState } from "react";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction"
import Button from "../basic/Button";
import { strEquals } from "../../lib/helpers/globalHelper";
import Icon from "../basic/Icon";
import { ICON } from "../../lib/consts/consts";

type ActionSelectionToolbarProps = {
  actions: DancerAction[],
  selectedTimingId?: string,
  onSelectTiming: (action?: DancerAction, timing?: DancerActionTiming) => void,
}

export default function ActionSelectionToolbar({
  actions, selectedTimingId, onSelectTiming
}: ActionSelectionToolbarProps){
  return <div className="flex w-screen gap-2 p-2 overflow-scroll max-w-screen">
    {
      actions.map(action => <ActionSection
        key={action.id}
        selectedTimingId={selectedTimingId}
        onSelectTiming={(timing) => {onSelectTiming(timing ? action : undefined, timing)}}
        action={action}
      />)
    }
  </div>
}

type ActionSectionProps = {
  action: DancerAction,
  onSelectTiming: (timing?: DancerActionTiming) => void,
  selectedTimingId?: string,
}

function ActionSection ({
  action, onSelectTiming, selectedTimingId
}: ActionSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return <div className="flex gap-2">
    <Button
      compact
      grey
      fontSize="text-base"
      onClick={() => {
        if (isExpanded) {
          setIsExpanded(false);
          onSelectTiming(undefined);
        } else {
          setIsExpanded(true);
        }
      }}>
      <div className="flex flex-row items-center justify-center gap-1 min-w-24 w-max">
        <span className="truncate">
          {action.name}
        </span>
        <Icon colour="white" src={isExpanded ? ICON.chevronBackward : ICON.chevronForward} size="xs"/>
      </div>
    </Button>
    {
      isExpanded &&
      action.timings.map(timing => <Button
        key={timing.id}
        compact
        primary={strEquals(timing.id, selectedTimingId)}
        fontSize="text-base"
        onClick={() => {onSelectTiming(timing)}}>
        <div className="flex items-center justify-center gap-1 truncate min-w-16">
          <span className="truncate">
            {timing.name}
          </span>
          <div className="flex items-center justify-center">
            <span>{"("}</span>
            <Icon colour={strEquals(timing.id, selectedTimingId) ? "white" : "grey"} src={ICON.person} size="xs"/>
            {timing.dancerIds.length}
            <span>{")"}</span>
          </div>
        </div>
      </Button>)
    }
  </div>
}