import classNames from "classnames";
import React from "react";

type LabelProps = {
  text: string,
  htmlFor: string
}

export default function Label({
  text, htmlFor
}: LabelProps) {
  return <label htmlFor={htmlFor} className="block text-base font-medium">{text}</label>
}

type FieldWithLabelProps = {
  label?: string,
  full?: boolean,
  fullHeight?: boolean,
  children: React.ReactNode
}

export function FieldWithLabel({
  label, full, fullHeight, children
}: FieldWithLabelProps) {
  const id = React.useId();

  const classes = classNames(
    "",
    {
      "w-full": full,
      "h-full": fullHeight,
    });

  return <div className={classes}>
    {
      label &&
      <Label htmlFor={id} text={label}/>
    }
    {children}
  </div>
}