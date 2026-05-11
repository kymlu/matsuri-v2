import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "./IconButton";

type ExpandableSectionProps = {
  title: React.ReactNode,
  children: React.ReactNode,
  rightButton?: React.ReactNode,
  defaultExpanded ?: boolean,
  level: 1 | 2,
}

export default function ExpandableSection({
  title, children, rightButton, defaultExpanded, level
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded ?? true);
  return <div className="space-y-2">
    <div className={"sticky flex flex-row justify-between w-full" + (level === 1 ? (" top-0 z-20 py-1 bg-gray-200 " + (isExpanded ? "rounded-t-lg" : "rounded-lg")) : " z-10 bg-gray-50")}>
      <button onClick={() => {
        setIsExpanded(prev => !prev);
      }} className='flex flex-row items-center w-full'>
        <IconButton
          src={isExpanded ? ICON.arrowDropDown : ICON.arrowRight}
          size="sm"
          colour="primary"
          noBorder
          asDiv />
        <h2 className={'font-bold text-primary ' + (level === 1 ? "text-xl" : "text-lg")}>{title}</h2>
      </button>
      {
        rightButton
      }
    </div>
    {
      isExpanded && children
    }
  </div>
}