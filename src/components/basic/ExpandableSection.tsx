import { useState } from "react";
import IconButton from "./IconButton";
import CustomMenu from "../inputs/CustomMenu";

type ExpandableSectionProps = {
  title: React.ReactNode,
  children: React.ReactNode,
  menuContents?: React.ReactNode,
  defaultExpanded ?: boolean,
  // Pass both to keep the open state outside, e.g. so it lasts after a dialog closes.
  expanded?: boolean,
  onExpandedChange?: (expanded: boolean) => void,
  level: 1 | 2,
}

export default function ExpandableSection({
  title, children, menuContents, defaultExpanded, expanded, onExpandedChange, level
}: ExpandableSectionProps) {
  const [ownIsExpanded, setOwnIsExpanded] = useState<boolean>(defaultExpanded ?? true);
  const isExpanded = expanded ?? ownIsExpanded;
  const setIsExpanded = (value: boolean) => {
    setOwnIsExpanded(value);
    onExpandedChange?.(value);
  };
  return <div>
    <div className={"sticky flex flex-row justify-between w-full" + (level === 1 ? (" top-0 z-20 py-1 bg-subtle " + (isExpanded ? "rounded-t-lg" : "rounded-lg")) : " z-10 bg-surface")}>
      <button onClick={() => setIsExpanded(!isExpanded)} className='flex flex-row items-center w-full'>
        <IconButton
          src={isExpanded ? "arrowDropDown" : "arrowRight"}
          size="sm"
          colour="primary"
          noBorder
          asDiv />
        <h2 className={'font-bold text-primary ' + (level === 1 ? "text-xl" : "text-lg")}>{title}</h2>
      </button>
      {
        menuContents && 
        <CustomMenu trigger={
          <IconButton
            src="moreVert"
            asDiv
            noBorder
            colour="grey"
            size="sm"
          />
        }>
          {menuContents}
        </CustomMenu>
      }
    </div>
    {
      isExpanded && children
    }
  </div>
}