import React, { useImperativeHandle } from "react";
import classNames from "classnames";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelpers";
import { FieldWithLabel } from "./Label";

export type TextInputProps = {
  name?: string,
  default?: string,
  onContentChange: (newContent: string) => void,
  placeholder?: string,
  clearable?: boolean,
  compact?: boolean,
  tall?: boolean,
  short?: boolean,
  centered?: boolean,
  required?: boolean,
  hasError?: boolean,
  errorMsg?: string,
  disabled?: boolean,
  ref?: React.Ref<any>,
  maxLength?: number,
  showLength?: boolean,
  hasOutline?: boolean,
  label?: string,
}

export default function LongTextInput(props: TextInputProps) {
  const [value, setValue] = React.useState<string>(props.default ?? "");

  useImperativeHandle(props.ref, () => ({
    changeValue: (newValue: string) => {
      setValue(newValue);
    }
  }));

  const handleChange = (newValue: string) => {
    setValue(newValue);
    props.onContentChange(newValue);
  }

  var inputClasses = classNames(
    "w-full h-full col-start-1 text-lg row-start-1 pl-2 text-black p-3 border-gray-300 rounded-md focus-within:border-primary focus:outline-none",
    {
      "border-2": props.hasOutline !== false,
      "pr-6": props.clearable,
      "pr-2": !props.clearable,
      "text-center": props.centered,
      "bg-gray-200": props.disabled,
      "border-primary bg-primary-lighter placeholder:text-primary-darker": (props.required && isNullOrUndefinedOrBlank(value)) || props.hasError,
    },);

  var wrapperClasses = classNames(
    "grid items-center w-full h-full grid-cols-1",
    {
      "mb-2": !props.compact,
    },);

  return (
    <FieldWithLabel label={props.label}>
      <div className={wrapperClasses}>
        <textarea
          disabled={props.disabled}
          name={props.name}
          maxLength={props.maxLength ?? 20}
          placeholder={props.placeholder ?? ""}
          value={value ?? ""}
          onInput={(event) => handleChange(event.currentTarget.value)}
          className={inputClasses}/>

        {
          props.clearable && !isNullOrUndefinedOrBlank(value) && 
          <button className="col-start-1 row-start-1 pr-2 ml-auto text-end" onClick={() => {handleChange("")}}>
            <img
              className="size-4"
              src={ICON.clear}
              alt="Clear text"/>
          </button>
        }

        {
          props.showLength &&
          <span className="text-sm text-end">{`${value.length}/${props.maxLength ?? 20}`}</span>
        }
      </div>
    </FieldWithLabel>
  )
}