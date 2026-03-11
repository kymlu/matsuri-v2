import { useState } from "react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "./IconButton";
import CustomMenu from "../inputs/CustomMenu";

type ExpandableSectionProps = {
  title: React.ReactNode,
  children: React.ReactNode,
  menuContents?: React.ReactNode,
}

export default function ExpandableSection({
    title, children, menuContents
  }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  return <div className="space-y-2">
    <div className="flex flex-row justify-between w-full">
      <button onClick={() => setIsExpanded(prev => !prev)} className='flex flex-row items-center w-full'>
        <IconButton
          src={isExpanded ? ICON.arrowDropDown : ICON.arrowRight}
          size="sm"
          colour="primary"
          noBorder
          asDiv />
        <h2 className='text-xl font-bold text-primary'>{title}</h2>
      </button>
      {
        menuContents && 
        <CustomMenu trigger={
          <IconButton
            src={ICON.moreVert}
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