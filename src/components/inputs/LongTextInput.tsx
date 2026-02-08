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
}

export default function LongTextInput({
  name,
  defaultValue,
  onContentChange,
  placeholder,
  clearable,
  compact,
  tall,
  short,
  centered,
  required,
  hasError,
  errorMsg,
  disabled,
  ref,
  maxLength,
  showLength,
  hasOutline,
  label,
}: TextInputProps) {
  const [value, setValue] = React.useState<string>(defaultValue ?? "");

  useImperativeHandle(ref, () => ({
    changeValue: (newValue: string) => {
      setValue(newValue);
    }
  }));

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onContentChange(newValue);
  }

  var inputClasses = classNames(
    "w-full h-full col-start-1 text-lg row-start-1 pl-2 text-black p-3 border-gray-300 rounded-md focus-within:border-primary focus:outline-none",
    {
      "border-2": hasOutline !== false,
      "pr-6": clearable,
      "pr-2": !clearable,
      "text-center": centered,
      "bg-gray-200": disabled,
      "border-primary bg-primary-lighter placeholder:text-primary-darker": (required && isNullOrUndefinedOrBlank(value)) || hasError,
    },);

  var wrapperClasses = classNames(
    "grid items-center w-full h-full grid-cols-1",
    {
      "mb-2": !compact,
    },);

  return (
    <FieldWithLabel full label={label}>
      <div className={wrapperClasses}>
        <textarea
          disabled={disabled}
          name={name}
          maxLength={maxLength}
          placeholder={placeholder ?? ""}
          value={value ?? ""}
          onInput={(event) => handleChange(event.currentTarget.value)}
          className={inputClasses}/>

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