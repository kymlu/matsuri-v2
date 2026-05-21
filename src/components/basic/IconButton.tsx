import classNames from "classnames"
import Icon from "./Icon";
import { useMemo } from "react";

type IconButtonProps = {
  src: string,
  subIconSrc?: string,
  label?: string,
  onClick?: () => void,
  noBorder?: boolean,
  disabled?: boolean,
  size?: "sm" | "md" | "lg",
  colour?: "primary" | "black" | "grey" | "white",
  asDiv?: boolean,
  crossedOut?: boolean,
  vertFlip?: boolean,
}

export default function IconButton ({
  src, subIconSrc, label, onClick,
  noBorder, disabled, size, colour, asDiv,
  crossedOut, vertFlip,
}: IconButtonProps) {
  var buttonClasses = classNames("relative flex justify-center items-center rounded-full", {
    "border-0": noBorder,
    "border-primary": noBorder !== true && colour === "primary",
    "border-black": noBorder !== true && (colour === undefined || colour === "black"),
    "border-gray-600": noBorder !== true && colour === "grey",
    "border-white": noBorder !== true && colour === "white",
    "border-2 bg-white p-1": noBorder !== true,
    "opacity-30": disabled,
    "min-w-16 min-h-16 size-16 max-w-16 max-h-16": noBorder !== true && size === "lg",
    "min-w-12 min-h-12 size-12 max-w-12 max-h-12": noBorder !== true && (size === undefined || size === "md"),
    "min-w-8 min-h-8 size-8 max-w-8 max-h-8": noBorder !== true && size === "sm",
  });

  const subIconSize = useMemo(() => 
    (size === undefined || size === "md") ? "sm" : size === "lg" ? "md" : "xs",
    [size]
  );

  var labelClasses = classNames("text-sm text-nowrap font-semibold", {
    "opacity-30": disabled
  })

  const icons = (
    <div className="relative flex items-center justify-center">
      <Icon src={src} size={size} colour={colour} crossedOut={crossedOut} vertFlip={vertFlip}/>
      {subIconSrc && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon src={subIconSrc} size={subIconSize} colour={colour}/>
        </div>
      )}
    </div>
  );

  return <div className="flex flex-col items-center justify-center">
    {
      asDiv !== true &&
      <button
        className={buttonClasses}
        disabled={disabled}
        onClick={onClick}>
        {icons}
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
        {icons}
      </div>
    }
    {label && <div className={labelClasses}>{label}</div>}
  </div>
}