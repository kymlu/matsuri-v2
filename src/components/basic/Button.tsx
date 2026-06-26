import React, { RefObject } from 'react';
import className from "classnames";
import Icon from './Icon';
import { ICON } from '../../lib/consts/consts';

type ButtonProps = {
  children: React.ReactNode
  primary?: boolean,
  primaryText?: boolean,
  grey?: boolean,
  greyText?: boolean,
  noBorder?: boolean,
  disabled?: boolean,
  full?: boolean,
  fixed?: boolean,
  compact ?: boolean,
  label?: string,
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void,
  type?: "submit" | "reset" | "button" | undefined,
  fontSize?: "text-lg" | "text-base" | "text-sm",
  asDiv?: boolean,
  buttonref?: RefObject<HTMLButtonElement | null>
  divref?: RefObject<HTMLDivElement | null>
}

export default function Button({
  children,
  primary, primaryText,
  grey, greyText,
  noBorder,
  disabled,
  full,
  fixed,
  compact,
  label,
  onClick,
  type,
  fontSize,
  asDiv,
  buttonref,
  divref
}: ButtonProps) {
  const classes = className("rounded-md " + (fontSize ?? "text-base"), {
    "w-full": full,
    "w-32 max-w-32 min-w-32": fixed,
    "py-0.5 px-1": compact,
    "border": noBorder !== true,
    "px-3 py-1.5": compact !== true,
    "lg:hover:bg-gray-100": !disabled && primary !== true && grey !== true,
    "lg:hover:opacity-70": !disabled && (primary || grey),
    "bg-white": primary !== true && grey !== true,
    "border-gray-400 ": primary !== true && grey !== true && !primaryText,
    "bg-primary text-white border-primary": primary,
    "bg-gray-600 text-white border-gray-600": grey,
    "lg:hover:bg-primary-light": primary && !disabled,
    "cursor-default opacity-50": disabled,
    "cursor-pointer": !disabled,
    "h-full items-center flex justify-center": asDiv,
    "text-primary border-primary": primaryText,
    "text-gray-600": greyText,
  });

  return <>
      {
        asDiv !== true && <button 
          ref={buttonref}
          type={type ?? "button"}
          button-name={label}
          disabled={disabled ?? false}
          className={classes}
          onClick={onClick}>
          {children}
        </button>
      }
      {
        asDiv && 
        <div
          ref={divref}
          className={classes}
          onClick={(e) => {
            if (disabled !== true) {
              onClick?.(e);
            }
          }}>
          {children}
        </div>
      }
    </>
}

type IconLabelButtonProps = {
  onClick?: () => void;
  icon: keyof typeof ICON;
  label: string;
  primaryText?: boolean,
  primary?: boolean;
  asDiv?: boolean;
  noBorder?: boolean,
  disabled?: boolean;
  full?: boolean;
  iconSize?: "sm" | "md" | "lg";
};

export function IconLabelButton({
  onClick,
  icon,
  label,
  noBorder,
  primaryText,
  primary = false,
  asDiv = false,
  disabled = false,
  full = false,
  iconSize = "sm",
}: IconLabelButtonProps) {
  return <Button
    onClick={onClick}
    primaryText={primaryText}
    primary={primary}
    asDiv={asDiv}
    disabled={disabled}
    noBorder={noBorder}
    full={full}
    >
    <div className="flex items-center justify-center gap-2">
      <Icon colour={primaryText ? "primary" : primary ? "white" : "black"} src={icon} size={iconSize}/>
      <div className={primary ? "font-bold" : 'font-semibold'}>
        {label}
      </div>
    </div>
  </Button>
}