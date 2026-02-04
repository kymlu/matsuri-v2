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

  var iconClasses = classNames({
    "min-w-14 min-h-14 size-14 max-w-14 max-h-14": props.size === "lg",
    "min-w-10 min-h-10 size-10 max-w-10 max-h-10": props.size === undefined || props.size === "md",
    "min-w-6 min-h-6 size-6 max-w-6 max-h-6": props.size === "sm"
  });

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
    {props.label && <div className="text-sm text-nowrap">{props.label}</div>}
  </div>
}