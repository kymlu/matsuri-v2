import React, { useImperativeHandle } from "react";
import classNames from "classnames";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { FieldWithLabel } from "./Label";
import IconButton from "../basic/IconButton";
import Icon from "../basic/Icon";

export type TextInputProps = {
  name?: string,
  defaultValue?: string,
  onContentChange: (newContent: string) => void,
  placeholder?: string,
  search?: boolean,
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
  label?: string,
  rightLabel?: string,
  restrictFn?: (s: string) => boolean,
}

export default function TextInput({
  name, defaultValue, onContentChange, placeholder,
  search, clearable, compact, tall, short, centered,
  required, hasError, errorMsg, disabled, ref, maxLength,
  showLength, label, rightLabel, restrictFn
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
    "col-start-1 border row-start-1 text-black p-3 border-gray-400 rounded-md focus-within:border-primary focus:outline-none",
    {
      "pr-6": clearable,
      "pr-2": !clearable,
      "pl-10": search,
      "pl-2": !search,
      "h-10": tall,
      "h-6": short,
      "text-center": centered,
      "bg-gray-200": disabled,
      "w-full": !compact,
      "min-w-32": compact,
      "border-primary bg-primary bg-opacity-20 placeholder:text-primary": (required && isNullOrUndefinedOrBlank(value?.trim())) || hasError,
    },);

  var wrapperClasses = classNames(
    "grid items-center w-full grid-cols-1",
    {
      "mb-2": !compact,
    },);

  return (
    <FieldWithLabel label={label} full={!compact}>
      <div className={wrapperClasses}>
        <div className="relative flex items-center gap-2">
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
          {
            search &&
            <div className="absolute flex items-center justify-center size-8 left-2">
              <Icon
                src={ICON.search}
                colour="grey"
                size="sm"/>
            </div>
          }
          {
            clearable && !isNullOrUndefinedOrBlank(value) && 
            <div className="absolute right-2">
              <IconButton
                src={ICON.clear}
                colour="primary"
                size="sm"
                noBorder
                onClick={() => {handleChange("")}}/>
            </div>
          }
        </div>

        {
          showLength &&
          <span className="text-sm text-end">{`${value.length}/${maxLength ?? 20}`}</span>
        }
      </div>
    </FieldWithLabel>
  )
}