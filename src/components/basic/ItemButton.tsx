import React from "react";
import className from "classnames";

export interface ItemButtonProps {
  text?: string,
  icon?: string,
  isDisabled?: boolean,
  filled?: boolean,
  fixed?: boolean,
  compact?: boolean,
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export default function ItemButton (props: ItemButtonProps) {
  const classes = className("border-primary border-2 rounded-md w-fit", {
    "bg-gray-200": props.isDisabled,
    "w-32 max-w-32 min-w-32": props.fixed,
    "bg-primary text-white border-primary": props.filled,
    "lg:hover:bg-gray-100": props.filled !== true,
    "lg:hover:opacity-70": props.filled,
    "p-1": props.compact,
    "p-2": props.compact !== true,
  });
  return (
    <button
      type="button"
      className={classes}
      onClick={props.onClick}>
      { props.icon && <img src={props.icon} className="size-8"/>}
      { props.text && <span>{props.text}</span>}
    </button>
  )
}