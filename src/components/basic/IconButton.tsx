import classNames from "classnames"
import Icon from "./Icon";

export default function IconButton (props: {
  src: string,
  label?: string,
  onClick?: () => void,
  noBorder?: boolean,
  disabled?: boolean,
  size?: "sm" | "md" | "lg",
  colour?: "primary",
  asDiv?: boolean,
}) {
  var buttonClasses = classNames("flex justify-center bg-white items-center rounded-full p-1 border-primary", {
    "border-0": props.noBorder,
    "border-2": props.noBorder !== true,
    "opacity-30": props.disabled,
    "min-w-16 min-h-16 size-16 max-w-16 max-h-16": props.size === "lg",
    "min-w-12 min-h-12 size-12 max-w-12 max-h-12": props.size === undefined || props.size === "md",
    "min-w-8 min-h-8 size-8 max-w-8 max-h-8": props.size === "sm",
  });

  var labelClasses = classNames("text-sm text-nowrap", {
    "opacity-30": props.disabled
  })

  return <div className="flex flex-col items-center justify-center">
    {
      props.asDiv !== true &&
      <button
        className={buttonClasses}
        disabled={props.disabled}
        onClick={props.onClick}>
        <Icon src={props.src} size={props.size} colour={props.colour}/>
      </button>
    }
    {
      props.asDiv &&
      <div
        className={buttonClasses}
        onClick={() => {
          if(props.disabled !== true) {
            props.onClick?.();
          }
        }}>
        <Icon src={props.src} size={props.size} colour={props.colour}/>
      </div>
    }
    {props.label && <div className={labelClasses}>{props.label}</div>}
  </div>
}