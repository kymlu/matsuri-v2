import classNames from "classnames"
import Icon from "./Icon";

type IconButtonProps = {
  src: string,
  label?: string,
  onClick?: () => void,
  noBorder?: boolean,
  disabled?: boolean,
  size?: "sm" | "md" | "lg",
  colour?: "primary" | "black" | "grey" | "white",
  asDiv?: boolean,
}

export default function IconButton ({
  src, label, onClick, noBorder, disabled, size, colour, asDiv
}: IconButtonProps) {
  var buttonClasses = classNames("flex justify-center items-center rounded-full", {
    "border-0": noBorder,
    "border-primary": noBorder !== true && colour === "primary",
    "border-black": noBorder !== true && (colour === undefined || colour === "black"),
    "border-gray-400": noBorder !== true && colour === "grey",
    "border-white": noBorder !== true && colour === "white",
    "border-2 bg-white p-1": noBorder !== true,
    "opacity-30": disabled,
    "min-w-16 min-h-16 size-16 max-w-16 max-h-16": noBorder !== true && size === "lg",
    "min-w-12 min-h-12 size-12 max-w-12 max-h-12": noBorder !== true && (size === undefined || size === "md"),
    "min-w-8 min-h-8 size-8 max-w-8 max-h-8": noBorder !== true && size === "sm",
  });

  var labelClasses = classNames("text-sm text-nowrap font-semibold", {
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