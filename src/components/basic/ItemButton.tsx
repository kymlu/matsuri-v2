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

export default function ItemButton ({
  text, icon, isDisabled, filled, fixed, compact, onClick
}: ItemButtonProps) {
  const classes = className("border-primary border-2 rounded-md w-fit", {
    "bg-gray-200": isDisabled,
    "w-32 max-w-32 min-w-32": fixed,
    "bg-primary text-white border-primary": filled,
    "lg:hover:bg-gray-100": filled !== true,
    "lg:hover:opacity-70": filled,
    "p-1": compact,
    "p-2": compact !== true,
  });
  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}>
      { icon && <img src={icon} className="size-8"/>}
      { text && <span>{text}</span>}
    </button>
  )
}