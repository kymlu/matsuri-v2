import { useRef, useState } from "react";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction"
import Button from "../basic/Button";
import { strEquals } from "../../lib/helpers/globalHelper";
import Icon from "../basic/Icon";

type ActionSelectionToolbarProps = {
  actions: DancerAction[],
  selectedTimingId?: string,
  onSelectTiming: (action?: DancerAction, timing?: DancerActionTiming) => void,
}

export default function ActionSelectionToolbar({
  actions, selectedTimingId, onSelectTiming
}: ActionSelectionToolbarProps){
  return <div className="flex w-screen gap-2 p-2 overflow-auto max-w-screen">
    {
      actions.map((action, index) => <ActionSection
        key={action.id}
        index={index}
        selectedTimingId={selectedTimingId}
        onSelectTiming={(timing) => {onSelectTiming(timing ? action : undefined, timing)}}
        action={action}
      />)
    }
  </div>
}

type ActionSectionProps = {
  action: DancerAction,
  index: number,
  onSelectTiming: (timing?: DancerActionTiming) => void,
  selectedTimingId?: string,
}

function ActionSection ({
  action, index, onSelectTiming, selectedTimingId
}: ActionSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(index === 0);
  const ref = useRef<HTMLButtonElement | null>(null);

  return <div className="flex gap-2">
    <Button
      buttonref={ref}
      grey
      fontSize="text-base"
      onClick={() => {
        if (isExpanded) {
          setIsExpanded(false);
          onSelectTiming(undefined);
        } else {
          ref.current?.scrollIntoView({"behavior": "smooth", "inline": "center"});
          setIsExpanded(true);
        }
      }}>
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
        timing={timing}
        selectedTimingId={selectedTimingId}
        onSelectTiming={() => onSelectTiming(timing)}/>)
    }
  </div>
}

type TimingButtonProps = {
  timing: DancerActionTiming,
  selectedTimingId?: string,
  onSelectTiming: () => void,
}

function TimingButton ({timing, selectedTimingId, onSelectTiming}: TimingButtonProps){
  const ref = useRef<HTMLButtonElement | null>(null);
  return <Button
    key={timing.id}
    buttonref={ref}
    primary={strEquals(timing.id, selectedTimingId)}
    fontSize="text-base"
    onClick={() => {
      onSelectTiming();
      ref.current?.scrollIntoView({"behavior": "smooth", "block": "center", "inline": "center"});
    }}>
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
}