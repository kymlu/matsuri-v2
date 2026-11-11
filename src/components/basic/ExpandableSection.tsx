import { useState } from "react";
import IconButton from "./IconButton";
import CustomMenu from "../inputs/CustomMenu";

type ExpandableSectionProps = {
  title: React.ReactNode,
  children: React.ReactNode,
  menuContents?: React.ReactNode,
  // Shown at the end of the heading row, inside the toggle button but outside the heading text (e.g. a count tag).
  titleExtra?: React.ReactNode,
  defaultExpanded ?: boolean,
  // Pass both to keep the open state outside, e.g. so it lasts after a dialog closes.
  expanded?: boolean,
  onExpandedChange?: (expanded: boolean) => void,
  level: 1 | 2,
}

export default function ExpandableSection({
  title, children, menuContents, titleExtra, defaultExpanded, expanded, onExpandedChange, level
}: ExpandableSectionProps) {
  const [ownIsExpanded, setOwnIsExpanded] = useState<boolean>(defaultExpanded ?? true);
  const isExpanded = expanded ?? ownIsExpanded;
  const setIsExpanded = (value: boolean) => {
    setOwnIsExpanded(value);
    onExpandedChange?.(value);
  };
  return <div>
    <div className={"sticky flex flex-row justify-between w-full" + (level === 1 ? (" top-0 z-20 py-1 bg-subtle " + (isExpanded ? "rounded-t-lg" : "rounded-lg")) : " z-10 bg-surface")}>
      <button onClick={() => setIsExpanded(!isExpanded)} className={'flex flex-row items-center w-full' + (level === 1 ? ' min-h-7' : '')}>
        <IconButton
          src={isExpanded ? "arrowDropDown" : "arrowRight"}
          size="sm"
          colour="primary"
          noBorder
          asDiv />
        {/* Year-style (level 1): small red label. Event-style (level 2): body colour. */}
        <h2 className={'font-bold ' + (level === 1 ? "text-sm text-primary" : "text-lg text-body")}>{title}</h2>
        {titleExtra && <span className="pl-2 pr-1 ml-auto">{titleExtra}</span>}
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