import React, { useImperativeHandle } from "react";
import classNames from "classnames";
import { DEFAULT_NAME_LENGTH } from "../../lib/consts/consts";
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
  type?: "text" | "password",
}

export default function TextInput({
  name, defaultValue, onContentChange, placeholder,
  search, clearable, compact, tall, short, centered,
  required, hasError, errorMsg, disabled, ref, maxLength,
  showLength, label, rightLabel, restrictFn, type = "text"
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
    "col-start-1 border row-start-1 text-black py-3 border-gray-400 rounded-md focus-within:border-primary focus:outline-none",
    {
      "pr-20": clearable && showLength,
      "pr-10": clearable !== showLength,
      "pr-2": !clearable && !showLength,
      "pl-10": search,
      "pl-2": !search,
      "h-10": tall,
      "h-6": short,
      "text-center": centered,
      "bg-gray-200": disabled,
      "w-full": !compact,
      "min-w-32": compact,
      "border-primary bg-primary/20 placeholder:text-primary": (required && isNullOrUndefinedOrBlank(value?.trim())) || hasError,
    },);

  var wrapperClasses = classNames(
    "grid items-center w-full grid-cols-1",
    {
      "mb-2": !compact && !showLength,
    },);

  return (
    <FieldWithLabel label={label} full={!compact}>
      <div className={wrapperClasses}>
        <div className="relative flex items-center gap-2">
          <input
            disabled={disabled}
            type={type}
            name={name}
            maxLength={maxLength ?? DEFAULT_NAME_LENGTH}
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
                src="search"
                colour="grey"
                size="sm"/>
            </div>
          }
          {
            (showLength || clearable) &&
            <div className="absolute flex items-center gap-1 right-2">
              {
                clearable && !isNullOrUndefinedOrBlank(value) && 
                <div>
                  <IconButton
                    src="clear"
                    colour="primary"
                    size="sm"
                    noBorder
                    onClick={() => {handleChange("")}}/>
                </div>
              }
              {
                showLength &&
                <span className="text-sm text-gray-600 text-end">{`${value.length}/${maxLength ?? 20}`}</span>
              }
            </div>
          }
        </div>
      </div>
    </FieldWithLabel>
  )
}