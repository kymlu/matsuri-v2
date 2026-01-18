import React from 'react';
import className from "classnames";

type ButtonProps = {
  children: React.ReactNode
  primary?: boolean,
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

export default function Button(props: ButtonProps) {
  const classes = className("border-2 rounded-md " + (props.fontSize ?? "text-base"), {
    "w-full": props.full,
    "w-32 max-w-32 min-w-32": props.fixed,
    "py-0.5 px-1": props.compact,
    "px-3 py-1.5": props.compact !== true,
    "lg:hover:bg-gray-100": !props.disabled && props.primary !== true,
    "lg:hover:opacity-70": !props.disabled && props.primary,
    "border-gray-300": props.primary !== true,
    "bg-primary text-white border-primary": props.primary,
    "lg:hover:bg-primary-light": props.primary && !props.disabled,
    "cursor-default opacity-50": props.disabled,
    "cursor-pointer": !props.disabled,
    "h-full items-center flex justify-center": props.asDiv,
  });

  return <>
      {
        props.asDiv !== true && <button 
          type={props.type ?? "button"}
          button-name={props.label}
          disabled={props.disabled ?? false}
          className={classes}
          onClick={props.onClick}>
          {props.children}
        </button>
      }
      {
        props.asDiv && 
        <div
          className={classes}
          onClick={(e) => {
            if (props.disabled !== true) {
              props.onClick?.(e);
            }
          }}>
          {props.children}
        </div>
      }
    </>
}

export function ActionButton(props: ButtonProps) {
  return <Button
    children={props.children}
    primary={props.primary}
    fontSize={props.fontSize ?? 'text-lg'}
    disabled={props.disabled}
    full={props.full}
    fixed={props.fixed}
    compact={props.compact}
    label={props.label}
    onClick={props.onClick}
    type={props.type}
    asDiv={props.asDiv}
  />
}