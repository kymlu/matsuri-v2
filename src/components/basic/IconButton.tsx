import classNames from "classnames"
import { strEquals } from "../../lib/helpers/globalHelpers";

export default function IconButton (props: {
  src: string,
  alt: string,
  label?: string,
  onClick: () => void,
  noBorder?: boolean,
  disabled?: boolean,
  size?: "sm" | "md" | "lg"
}) {
  var classes = classNames("flex justify-center bg-white items-center rounded-full p-1 border-primary", {
    "border-0": props.noBorder,
    "border-2": props.noBorder !== true,
    "opacity-30": props.disabled,
    "min-w-16 min-h-16 size-16 max-w-16 max-h-16": props.size === "lg",
    "min-w-12 min-h-12 size-12 max-w-12 max-h-12": props.size === undefined || props.size === "md",
    "min-w-8 min-h-8 size-8 max-w-8 max-h-8": props.size === "sm",
  });

  return <div className="flex flex-col items-center justify-center">
    <button
      className={classes}
      disabled={props.disabled}
      onClick={props.onClick}>
      <img
        src={props.src}
        alt={props.alt}
        className="size-8 max-w-12 max-h-12"
        />
    </button>
    {props.label && <div className="text-sm">{props.label}</div>}
  </div>
}