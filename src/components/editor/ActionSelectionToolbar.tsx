import { useState } from "react";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction"
import Button from "../basic/Button";
import { strEquals } from "../../lib/helpers/globalHelper";

export default function ActionSelectionToolbar(props: {
  actions: DancerAction[],
  selectedTimingId?: string,
  onSelectTiming: (action?: DancerAction, timing?: DancerActionTiming) => void,
}){
  var {actions, selectedTimingId, onSelectTiming} = props;
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

function ActionSection (props: {
  action: DancerAction,
  onSelectTiming: (timing?: DancerActionTiming) => void,
  selectedTimingId?: string,
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  var {action, onSelectTiming, selectedTimingId} = props;

  return <div className="flex gap-2">
    <Button
      fixed
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
      <div className="truncate max-w-32">
        {action.name}
      </div>
    </Button>
    {
      isExpanded &&
      action.timings.map(timing => <Button
        key={timing.id}
        compact
        primary={strEquals(timing.id, selectedTimingId)}
        fontSize="text-base"
        onClick={() => {onSelectTiming(timing)}}
        fixed>
        <div className="truncate max-w-32">
          {timing.name}
        </div>
      </Button>)
    }
  </div>
}