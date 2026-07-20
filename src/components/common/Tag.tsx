import classNames from "classnames"
import Icon from "../basic/Icon"
import { ICON } from "../../lib/consts/consts"
import { ChoreoStatus } from "../../pages/HomePage"

type TagProps = {
  type: "primary" | "filled" | "grey",
  text: string,
  icon?: keyof typeof ICON,
  compact?: boolean,
  dottedLine?: boolean,
}

export function Tag ({
  icon, text, type, compact, dottedLine
}: TagProps) {
  const tagClasses = classNames("w-min font-semibold flex items-center gap-0.5 border rounded-md text-nowrap",
    {
      "bg-primary text-white border-primary": type === "filled",
      "bg-transparent text-primary border-primary": type === "primary",
      "bg-transparent text-gray-600 border-gray-600": type === "grey",
      "px-0.5 py-0 text-xs": compact === true,
      "px-1 py-0.5 text-sm ": compact !== true,
      "border-dashed": dottedLine && type !== "filled"
    }
  )
  
  return <div className={tagClasses}>
    <span>{ text }</span>
    {
      icon &&
      <Icon
        src={icon}
        colour={type === "filled" ? "white" : type === "grey" ? "grey" : "primary"}
        size="xs"/>
    }
  </div>
}

type ChoreoStatusTagProps = {
  choreoStatus: ChoreoStatus,
  version?: number,
  compact?: boolean,
}

export function ChoreoStatusTag ({
  choreoStatus, version = 0, compact = false,
}: ChoreoStatusTagProps) {

  return <>
    {
      choreoStatus === "upToDate" &&
      <Tag compact={compact} type="grey" text={`v${version}`}/>
    }
    {
      choreoStatus === "edited" &&
      <Tag compact={compact} type="grey" text={`v${version}`} icon="edit"/>
    }
    {
      choreoStatus === "syncRequired" &&
      <Tag compact={compact} type="filled" text={`v${version}`} icon="warning"/>
    }
    {
      (choreoStatus === "localOnly") &&
      <Tag compact={compact} type="grey" text="未公開"/>
    }
  </>
}