import React from "react";

type LabelProps = {
  text: string,
  htmlFor: string
}

export default function Label({
  text, htmlFor
}: LabelProps) {
  return <label htmlFor={htmlFor} className="block text-lg font-medium">{text}</label>
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

  return <div className={full ? "w-full h-full" : ""}>
    {
      label &&
      <Label htmlFor={id} text={label}/>
    }
    {children}
  </div>
}