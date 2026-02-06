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

export default function Button(props: ButtonProps) {
  const classes = className("border-2 rounded-md " + (props.fontSize ?? "text-base"), {
    "w-full": props.full,
    "w-32 max-w-32 min-w-32": props.fixed,
    "py-0.5 px-1": props.compact,
    "px-3 py-1.5": props.compact !== true,
    "lg:hover:bg-gray-100": !props.disabled && props.primary !== true && props.grey !== true,
    "lg:hover:opacity-70": !props.disabled && (props.primary || props.grey),
    "border-gray-300 bg-white": props.primary !== true && props.grey !== true,
    "bg-primary text-white border-primary": props.primary,
    "bg-gray-600 text-white border-gray-600": props.grey,
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

export function IconLabelButton(props: {
  onClick: () => void,
  icon: string,
  label: string,
  primary?: boolean,
  asDiv?: boolean,
  disabled?: boolean,
  full?: boolean,
  iconSize?: "sm" | "md" | "lg",
}) {
  const {onClick, icon, label, primary, asDiv, disabled, full, iconSize} = props;
  return <Button
    onClick={onClick}
    primary={primary}
    asDiv={asDiv}
    disabled={disabled}
    full={full}
    >
    <div className="flex items-center justify-center gap-2">
      <Icon colour={primary ? "white" : "black"} src={icon} size={iconSize ?? "sm"}/>
      {label}
    </div>
  </Button>
}