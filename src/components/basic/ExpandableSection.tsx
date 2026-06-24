import { useState } from "react";
import IconButton from "./IconButton";
import CustomMenu from "../inputs/CustomMenu";

type ExpandableSectionProps = {
  title: React.ReactNode,
  children: React.ReactNode,
  menuContents?: React.ReactNode,
  defaultExpanded ?: boolean,
  level: 1 | 2,
}

export default function ExpandableSection({
  title, children, menuContents, defaultExpanded, level
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded ?? true);
  return <div className="space-y-2">
    <div className={"sticky flex flex-row justify-between w-full" + (level === 1 ? (" top-0 z-20 py-1 bg-gray-200 " + (isExpanded ? "rounded-t-lg" : "rounded-lg")) : " z-10 bg-gray-50")}>
      <button onClick={() => setIsExpanded(prev => !prev)} className='flex flex-row items-center w-full'>
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