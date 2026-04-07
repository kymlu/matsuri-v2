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
  full?: boolean
  children: React.ReactNode
}

export function FieldWithLabel({
  label, full, children
}: FieldWithLabelProps) {
  var id = React.useId();

  return <div className={full ? "w-full" : ""}>
    {
      label &&
      <Label text={label}/>
    }
    {children}
  </div>
}