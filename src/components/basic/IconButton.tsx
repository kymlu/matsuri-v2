import classNames from "classnames"
import Icon from "./Icon";

type IconButtonProps = {
  src: string,
  label?: string,
  onClick?: () => void,
  noBorder?: boolean,
  disabled?: boolean,
  size?: "sm" | "md" | "lg",
  colour?: "primary",
  asDiv?: boolean,
}

export default function IconButton ({
  src, label, onClick, noBorder, disabled, size, colour, asDiv
}: IconButtonProps) {
  var buttonClasses = classNames("flex justify-center items-center rounded-full p-1 border-primary", {
    "border-0": noBorder,
    "border-2 bg-white": noBorder !== true,
    "opacity-30": disabled,
    "min-w-16 min-h-16 size-16 max-w-16 max-h-16": size === "lg",
    "min-w-12 min-h-12 size-12 max-w-12 max-h-12": size === undefined || size === "md",
    "min-w-8 min-h-8 size-8 max-w-8 max-h-8": size === "sm",
  });

  var labelClasses = classNames("text-sm text-nowrap", {
    "opacity-30": disabled
  })

  return <div className="flex flex-col items-center justify-center">
    {
      asDiv !== true &&
      <button
        className={buttonClasses}
        disabled={disabled}
        onClick={onClick}>
        <Icon src={src} size={size} colour={colour}/>
      </button>
    }
    {
      asDiv &&
      <div
        className={buttonClasses}
        onClick={() => {
          if(disabled !== true) {
            onClick?.();
          }
        }}>
        <Icon src={src} size={size} colour={colour}/>
      </div>
    }
    {label && <div className={labelClasses}>{label}</div>}
  </div>
}