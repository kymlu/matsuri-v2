import classNames from "classnames";
import React from "react";

type LabelProps = {
  text: string,
}

export default function Label({
  text
}: LabelProps) {
  return <span className="block text-lg font-medium">{text}</span>
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
  var id = React.useId();

  var classes = classNames(
    "",
    {
      "w-full": full,
      "h-full": fullHeight,
    });

  return <div className={classes}>
    {
      label &&
      <Label text={label}/>
    }
    {children}
  </div>
}