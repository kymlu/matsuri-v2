import React from 'react';
import className from "classnames";
import Icon from './Icon';

type ButtonProps = {
  children: React.ReactNode
  primary?: boolean,
  grey?: boolean,
  disabled?: boolean,
  full?: boolean,
  fixed?: boolean,
  compact ?: boolean,
  label?: string,
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void,
  type?: "submit" | "reset" | "button" | undefined,
  fontSize?: "text-lg" | "text-base" | "text-sm",
  asDiv?: boolean,
}

export default function Button({
  children,
  primary,
  grey,
  disabled,
  full,
  fixed,
  compact,
  label,
  onClick,
  type,
  fontSize,
  asDiv
}: ButtonProps) {
  const classes = className("border-2 rounded-md " + (fontSize ?? "text-base"), {
    "w-full": full,
    "w-32 max-w-32 min-w-32": fixed,
    "py-0.5 px-1": compact,
    "px-3 py-1.5": compact !== true,
    "lg:hover:bg-gray-100": !disabled && primary !== true && grey !== true,
    "lg:hover:opacity-70": !disabled && (primary || grey),
    "border-gray-300 bg-white": primary !== true && grey !== true,
    "bg-primary text-white border-primary": primary,
    "bg-gray-600 text-white border-gray-600": grey,
    "lg:hover:bg-primary-light": primary && !disabled,
    "cursor-default opacity-50": disabled,
    "cursor-pointer": !disabled,
    "h-full items-center flex justify-center": asDiv,
  });

  return <>
      {
        asDiv !== true && <button 
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
  onClick: () => void;
  icon: string;
  label: string;
  primary?: boolean;
  asDiv?: boolean;
  disabled?: boolean;
  full?: boolean;
  iconSize?: "sm" | "md" | "lg";
};

export function IconLabelButton({
  onClick,
  icon,
  label,
  primary = false,
  asDiv = false,
  disabled = false,
  full = false,
  iconSize = "sm",
}: IconLabelButtonProps) {
  return <Button
    onClick={onClick}
    primary={primary}
    asDiv={asDiv}
    disabled={disabled}
    full={full}
    >
    <div className="flex items-center justify-center gap-2">
      <Icon colour={primary ? "white" : "black"} src={icon} size={iconSize}/>
      {label}
    </div>
  </Button>
}