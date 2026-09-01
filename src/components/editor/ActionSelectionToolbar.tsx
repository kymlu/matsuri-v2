import { memo, useCallback, useRef, useState } from "react";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction"
import Button from "../basic/Button";
import { strEquals } from "../../lib/helpers/globalHelper";
import Icon from "../basic/Icon";

type ActionSelectionToolbarProps = {
  actions: DancerAction[],
  selectedTimingId?: string,
  onSelectTiming: (action?: DancerAction, timing?: DancerActionTiming) => void,
}

function ActionSelectionToolbar({
  actions, selectedTimingId, onSelectTiming
}: ActionSelectionToolbarProps){
  return <div className="flex w-screen gap-1 p-2 overflow-auto max-w-screen">
    {
      actions.map((action, index) => <ActionSection
        key={action.id}
        index={index}
        selectedTimingId={selectedTimingId}
        onSelectTiming={onSelectTiming}
        action={action}
      />)
    }
  </div>
}

export default memo(ActionSelectionToolbar);

type ActionSectionProps = {
  action: DancerAction,
  index: number,
  onSelectTiming: (action?: DancerAction, timing?: DancerActionTiming) => void,
  selectedTimingId?: string,
}

const ActionSection = memo(function ActionSection ({
  action, index, onSelectTiming, selectedTimingId
}: ActionSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(index === 0);
  const ref = useRef<HTMLButtonElement | null>(null);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
      onSelectTiming(undefined, undefined);
    } else {
      ref.current?.scrollIntoView({"behavior": "smooth", "inline": "center"});
      setIsExpanded(true);
    }
  }, [isExpanded, onSelectTiming]);

  return <div className="flex gap-1">
    <Button
      buttonref={ref}
      grey
      fontSize="text-base"
      onClick={handleToggle}>
      <div className="flex flex-row items-center justify-center h-6 gap-1 min-w-24 w-max">
        <span className="font-semibold truncate">
          {action.name}
        </span>
        <Icon colour="white" src={isExpanded ? "chevronBackward" : "chevronForward"} size="xs"/>
      </div>
    </Button>
    {
      isExpanded &&
      action.timings.map(timing => <TimingButton
        key={timing.id}
        action={action}
        timing={timing}
        selectedTimingId={selectedTimingId}
        onSelectTiming={onSelectTiming}/>)
    }
  </div>
});

type TimingButtonProps = {
  action: DancerAction,
  timing: DancerActionTiming,
  selectedTimingId?: string,
  onSelectTiming: (action?: DancerAction, timing?: DancerActionTiming) => void,
}

const TimingButton = memo(function TimingButton ({action, timing, selectedTimingId, onSelectTiming}: TimingButtonProps){
  const ref = useRef<HTMLButtonElement | null>(null);

  const handleClick = useCallback(() => {
    onSelectTiming(action, timing);
    ref.current?.scrollIntoView({"behavior": "smooth", "block": "center", "inline": "center"});
  }, [onSelectTiming, action, timing]);

  return <Button
    buttonref={ref}
    primary={strEquals(timing.id, selectedTimingId)}
    fontSize="text-base"
    onClick={handleClick}>
    <div className="flex items-center justify-center h-6 gap-1 truncate min-w-16">
      <span className="truncate">
        {timing.name}
      </span>
      <div className="flex items-center justify-center">
        <span>{"("}</span>
        <Icon colour={strEquals(timing.id, selectedTimingId) ? "white" : "grey"} src="group" size="xs"/>
        {timing.dancerIds.length}
        <span>{")"}</span>
      </div>
    </div>
  </Button>
});