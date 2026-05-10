import React, { useImperativeHandle, useMemo, useRef } from "react";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import classNames from "classnames";
import { FieldWithLabel } from "./Label";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { getJpDate } from "../../lib/helpers/dateHelper";

export type DateInputProps = {
  name?: string,
  defaultValue?: string,
  onDateChange: (newDate: string) => void,
  compact?: boolean,
  tall?: boolean,
  short?: boolean,
  centered?: boolean,
  required?: boolean,
  disabled?: boolean,
  hasError?: boolean,
  ref?: React.Ref<any>,
  label?: string,
}

export default function DateInput({
  name, defaultValue, onDateChange, compact, tall, short, centered, required, disabled, hasError, ref, label
}: DateInputProps) {
  const [value, setValue] = React.useState<string | undefined>(defaultValue ?? undefined);
  const displayValue = useMemo(() => {
    if (isNullOrUndefinedOrBlank(value)) {
      return ""
    } else {
      return getJpDate(new Date(value!!), false);
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    changeValue: (newValue: string) => {
      setValue(newValue);
    }
  }));

  function handleChange(newValue: string) {
    setValue(newValue);
    onDateChange(newValue);
  }

  var inputClasses = classNames(
    "col-start-1 pointer-events-none row-start-1 px-2 py-3 text-black border border-gray-400 rounded-md focus-within:border-primary focus:outline-none",
    {
      "h-10": tall,
      "h-6": short,
      "text-center": centered,
      "bg-gray-200": disabled,
      "w-full": !compact,
      "min-w-32": compact,
      "border-primary bg-primary/20 text-primary-darker": (required && isNullOrUndefinedOrBlank(value)) || hasError,
      "bg-white disabled:bg-white disabled:text-black": !(required && isNullOrUndefinedOrBlank(value)) && !hasError && !disabled,
    },)

  var wrapperClasses = classNames(
    "grid relative items-center w-full grid-cols-1",
    {
      "mb-2": !compact,
    });

  return (
    <FieldWithLabel label={label} full={!compact}>
      <div className={wrapperClasses}>
        <input
          type="text"
          value={displayValue}
          className={inputClasses}/>
        <div className="absolute right-2">
          <IconButton
            size="sm"
            colour={disabled ? "grey" : "primary"}
            noBorder
            src={ICON.calendarToday}/>
        </div>
        <input
          disabled={disabled}
          type="date"
          name={name}
          value={value}
          onInput={(event) => handleChange(event.currentTarget.value)}
          className="absolute inset-0 z-10 w-full h-full opacity-0"/>
      </div>
    </FieldWithLabel>
  )
}