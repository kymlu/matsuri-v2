import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "./IconButton";

type ExpandableSectionProps = {
  title: React.ReactNode,
  children: React.ReactNode,
  rightButton?: React.ReactNode,
}

export default function ExpandableSection({
    title, children, rightButton
  }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  return <div className="space-y-2">
    <div className="flex flex-row justify-between w-full">
      <button onClick={() => {
        setIsExpanded(prev => !prev);
      }} className='flex flex-row items-center w-full'>
        <IconButton
          src={isExpanded ? ICON.arrowDropDown : ICON.arrowRight}
          size="sm"
          colour="primary"
          noBorder
          asDiv />
        <h2 className='text-xl font-bold text-primary'>{title}</h2>
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