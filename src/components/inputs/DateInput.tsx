import React, { useImperativeHandle } from "react";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import classNames from "classnames";
import { FieldWithLabel } from "./Label";

export type DateInputProps = {
  name?: string,
  defaultValue?: string,
  onDateChange: (newDate: string) => void,
  compact?: boolean,
  tall?: boolean,
  short?: boolean,
  centered?: boolean,
  required?: boolean,
  hasError?: boolean,
  ref?: React.Ref<any>,
  label?: string,
}

export default function DateInput({
  name, defaultValue, onDateChange, compact, tall, short, centered, required, hasError, ref, label
}: DateInputProps) {
  const [value, setValue] = React.useState<string | undefined>(defaultValue ?? undefined);

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
    "w-full col-start-1 row-start-1 px-2 text-black border border-gray-300 rounded-md focus-within:border-primary focus:outline-none",
    {
      "h-10": tall,
      "h-6": short,
      "text-center": centered,
      "border-primary bg-primary-lighter text-primary-darker": required && isNullOrUndefinedOrBlank(value) || hasError,
    },)

  var wrapperClasses = classNames(
    "grid items-center w-full grid-cols-1",
    {
      "mb-2": !compact,
    },)

  return (
    <FieldWithLabel label={label}>
      <div className={wrapperClasses}>
        <input
          type="date"
          name={name}
          value={value}
          onInput={(event) => handleChange(event.currentTarget.value)}
          className={inputClasses}/>
      </div>
    </FieldWithLabel>
  )
}