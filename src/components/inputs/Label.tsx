import React from "react";

export default function Label(props: {text: string, htmlFor: string}) {
  return <label htmlFor={props.htmlFor} className="block text-lg font-medium">{props.text}</label>
}

export function FieldWithLabel(props: {
  label?: string,
  children: React.ReactNode
}) {
  var id = React.useId();

  return <div className="w-full h-full">
    {
      props.label &&
      <Label htmlFor={id} text={props.label}/>
    }
    {props.children}
  </div>
}