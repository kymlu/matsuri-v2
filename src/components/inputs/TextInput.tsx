import React, { useImperativeHandle } from "react";
import classNames from "classnames";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { FieldWithLabel } from "./Label";

export type TextInputProps = {
  name?: string,
  defaultValue?: string,
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
  rightLabel?: string,
  restrictFn?: (s: string) => boolean,
}

export default function TextInput({
  name, defaultValue, onContentChange, placeholder,
  clearable, compact, tall, short, centered, required,
  hasError, errorMsg, disabled, ref, maxLength,
  showLength, hasOutline, label, rightLabel, restrictFn
}: TextInputProps) {
  const [value, setValue] = React.useState<string>(defaultValue ?? "");

  useImperativeHandle(ref, () => ({
    changeValue: (newValue: string) => {
      setValue(newValue);
    }
  }));

  const handleChange = (newValue: string) => {
    if (!restrictFn || restrictFn(newValue)) {
      setValue(newValue);
      onContentChange(newValue);
    }
  }

  var inputClasses = classNames(
    "col-start-1 text-lg row-start-1 pl-2 text-black p-3 border-gray-300 rounded-md focus-within:border-primary focus:outline-none",
    {
      "border-2": hasOutline !== false,
      "pr-6": clearable,
      "pr-2": !clearable,
      "h-10": tall,
      "h-6": short,
      "text-center": centered,
      "bg-gray-200": disabled,
      "w-full": !compact,
      "w-32": compact,
      "border-primary bg-primary bg-opacity-30 placeholder:text-primary": (required && isNullOrUndefinedOrBlank(value)) || hasError,
    },);

  var wrapperClasses = classNames(
    "grid items-center w-full grid-cols-1",
    {
      "mb-2": !compact,
    },);

  return (
    <FieldWithLabel label={label}>
      <div className={wrapperClasses}>
        <div className="flex items-center gap-2">
          <input
            disabled={disabled}
            type="text"
            name={name}
            maxLength={maxLength ?? 20}
            placeholder={placeholder ?? ""}
            value={value ?? ""}
            onInput={(event) => handleChange(event.currentTarget.value)}
            className={inputClasses}/>
          {
            rightLabel && <span>{rightLabel}</span>
          }
        </div>

        {
          clearable && !isNullOrUndefinedOrBlank(value) && 
          <button className="col-start-1 row-start-1 pr-2 ml-auto text-end" onClick={() => {handleChange("")}}>
            <img
              className="size-4"
              src={ICON.clear}
              alt="Clear text"/>
          </button>
        }

        {
          showLength &&
          <span className="text-sm text-end">{`${value.length}/${maxLength ?? 20}`}</span>
        }
      </div>
    </FieldWithLabel>
  )
}