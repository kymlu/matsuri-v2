import classNames from "classnames"
import Icon from "./Icon";
import { useMemo } from "react";
import { ICON, IMG } from "../../lib/consts/consts";
import { getImgPath } from "../../lib/helpers/globalHelper";

type IconButtonProps = {
  src?: keyof typeof ICON,
  subIconSrc?: keyof typeof ICON,
  imgSrc?: keyof typeof IMG,
  subImgSrc?: keyof typeof IMG,
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
  src, subIconSrc, imgSrc, subImgSrc, label, onClick,
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

  var imgClasses = classNames("self-center justify-self-center flex-1", {
    "min-w-12 min-h-12 size-12 max-w-12 max-h-12": size === "lg",
    "min-w-9 min-h-9 size-9x max-w-9 max-h-9": (size === undefined || size === "md"),
    "min-w-6 min-h-6 size-6 max-w-6 max-h-6": size === "sm",
  });

  var subImgClasses = classNames("self-center justify-self-center flex-1", {
    "min-w-9 min-h-9 size-9 max-w-9 max-h-9": size === "lg",
    "min-w-6 min-h-6 size-6 max-w-6 max-h-6": (size === undefined || size === "md"),
    "min-w-4 min-h-4 size-4 max-w-4 max-h-4": size === "sm",
  });

  var labelClasses = classNames("text-sm text-nowrap font-semibold", {
    "opacity-30": disabled
  })

  const icons = (
    <div className="relative flex items-center justify-center">
      {
        subIconSrc && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon src={subIconSrc} size={subIconSize} colour={colour}/>
        </div>
      )}
      {
        src &&
        <Icon src={src} size={size} colour={colour} crossedOut={crossedOut} vertFlip={vertFlip}/>
      }
      {
        imgSrc &&
        <img src={getImgPath(imgSrc)} className={imgClasses}/>
      }
      {
        subImgSrc && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={getImgPath(subImgSrc)} className={subImgClasses}/>
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