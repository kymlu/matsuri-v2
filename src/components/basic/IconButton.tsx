import classNames from "classnames"
import Icon from "./Icon";
import { useMemo } from "react";
import { ICON, IMG } from "../../lib/consts/consts";
import { getImgPath } from "../../lib/helpers/globalHelper";

type IconButtonProps = {
  src?: keyof typeof ICON,
  subIconSrc?: keyof typeof ICON,
  subIconPosition?: "center" | "corner",
  subIconCrossedOut?: boolean,
  imgSrc?: keyof typeof IMG,
  subImgSrc?: keyof typeof IMG,
  label?: string,
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void,
  noBorder?: boolean,
  disabled?: boolean,
  size?: "sm" | "md" | "lg",
  colour?: "primary" | "black" | "grey" | "white",
  asDiv?: boolean,
  crossedOut?: boolean,
  vertFlip?: boolean,
}

export default function IconButton ({
  src, subIconSrc, subIconPosition = "center", subIconCrossedOut, imgSrc, subImgSrc, label, onClick,
  noBorder, disabled, size, colour, asDiv,
  crossedOut, vertFlip,
}: IconButtonProps) {
  const buttonClasses = classNames("relative flex justify-center items-center rounded-full", {
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

  const cornerSubIconSize = useMemo(() =>
    (size === undefined || size === "md") ? "xs" : size === "lg" ? "sm" : "2xs",
    [size]
  );

  const cornerSubIconClasses = classNames(
    "absolute bottom-0 right-0 flex items-center justify-center overflow-hidden",
    {
      "size-6": size === "lg",
      "size-5": size === undefined || size === "md",
      "size-4 rounded-full translate-x-1/4 translate-y-1/4 shadow-white/35 shadow bg-white ": size === "sm",
    }
  );

  const imgClasses = classNames("self-center justify-self-center flex-1", {
    "min-w-12 min-h-12 size-12 max-w-12 max-h-12": size === "lg",
    "min-w-9 min-h-9 size-9x max-w-9 max-h-9": (size === undefined || size === "md"),
    "min-w-6 min-h-6 size-6 max-w-6 max-h-6": size === "sm",
  });

  const subImgClasses = classNames("self-center justify-self-center flex-1", {
    "min-w-9 min-h-9 size-9 max-w-9 max-h-9": size === "lg",
    "min-w-6 min-h-6 size-6 max-w-6 max-h-6": (size === undefined || size === "md"),
    "min-w-4 min-h-4 size-4 max-w-4 max-h-4": size === "sm",
  });
  
  const [labelLine1, labelLine2 = ""] = useMemo(() => label?.split("\n") ?? [""], [label]);

  const labelWrapperClasses = classNames("flex flex-col items-center h-8", {
    "opacity-30": disabled,
    "w-16": size === "lg",
    "w-12": size === undefined || size === "md",
    "w-8": size === "sm",
  });

  const labelLineClasses = classNames("flex justify-center w-full text-sm leading-4 font-semibold text-nowrap");

  const icons = (
    <div className="relative flex items-center justify-center">
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
      {
        subIconSrc && subIconPosition === "center" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon src={subIconSrc} size={subIconSize} colour={colour} crossedOut={subIconCrossedOut}/>
        </div>
      )}
      {
        subIconSrc && subIconPosition === "corner" && (
        <div className={cornerSubIconClasses}>
          <Icon src={subIconSrc} size={cornerSubIconSize} colour={colour} crossedOut={subIconCrossedOut}/>
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
        onClick={(e) => {
          onClick?.(e);
        }}>
        {icons}
      </button>
    }
    {
      asDiv &&
      <div
        className={buttonClasses}
        onClick={(e) => {
          if(disabled !== true) {
            onClick?.(e);
          }
        }}>
        {icons}
      </div>
    }
    {
      label &&
      <div className={labelWrapperClasses}>
        <div className={labelLineClasses}>{labelLine1}</div>
        {labelLine2 && <div className={labelLineClasses}>{labelLine2}</div>}
      </div>
    }
  </div>
}
