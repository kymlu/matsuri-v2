import classNames from "classnames"
import Icon from "./basic/Icon"

type TagProps = {
  type: "primary" | "filled" | "grey",
  text: string,
  icon?: string,
}

export function Tag ({
  icon, text, type
}: TagProps) {
  var tagClasses = classNames("w-min px-1 py-0.5 text-sm font-semibold flex items-center gap-0.5 border rounded-md text-nowrap",
    {
      "bg-primary text-white border-primary": type === "filled",
      "bg-white text-primary border-primary": type === "primary",
      "bg-white text-gray-600 border-gray-600": type === "grey",
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