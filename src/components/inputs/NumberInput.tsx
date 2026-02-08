import { NumberField } from "@base-ui/react";
import classNames from "classnames";
import React, { useImperativeHandle } from "react";
import { FieldWithLabel } from "./Label";

export interface NumberInputProps {
  name?: string,
  defaultValue: number,
  min?: number,
  max?: number,
  baseStep?: number,
  buttonStep?: number,
  onChange?: (newValue: number | null) => void,
  disabled?: boolean,
  compact?: boolean,
  ref?: React.Ref<any>,
  label?: string,
}

export default function NumberInput ({
  name, defaultValue, min, max, baseStep, buttonStep, onChange, disabled, compact, ref, label
}: NumberInputProps) {
  const [value, setValue] = React.useState<number | null>(defaultValue ?? 0);
  const id = React.useId();

  useImperativeHandle(ref, () => ({
    changeValue: (newValue: number) => {
      setValue(newValue);
    }
  }));
  
  const wrapperClasses = classNames("flex flex-row items-center justify-between w-full",
    {
      "mb-2": compact,
    })
  
  return (
    <FieldWithLabel label={label}>
      <NumberField.Root
        id={id}
        name={name}
        value={value}
        onValueChange={(newValue) => {
          const step = baseStep ?? 1;
          const roundedRaw = newValue ? Math.round(newValue/step) * step : min ?? 0;
          const precision = (step.toString().split('.')[1]?.length) || 0;
          const rounded = parseFloat(roundedRaw.toFixed(precision));
          setValue(rounded);
          onChange?.(rounded);
        }}
        defaultValue={defaultValue}
        className="flex flex-col items-start gap-1"
        min={min ?? 0}
        max={max ?? 1000}
        step={buttonStep ?? 1}
        disabled={disabled}
        >
        <div className={wrapperClasses}>
          <NumberField.Group className="grid grid-cols-[1fr,2fr,1fr] w-full bg-white data-[disabled]:bg-gray-200 border-2 rounded-md border-gray-300 focus-within:border-primary">
            <NumberField.Decrement className={"flex items-center justify-center select-none rounded-l-md min-w-4 bg-clip-padding" + ((value ?? 1) > (min ?? 0) ? " [&:not([data-disabled])]:lg:hover:bg-gray-100 [&:not([data-disabled])]:active:bg-gray-100 text-gray-900": " text-gray-400")}>
              <MinusIcon />
            </NumberField.Decrement>
            <NumberField.Input className="p-3 text-lg text-center text-gray-900 min-w-10 tabular-nums focus:z-1 focus:outline-none focus:-outline-offset-1" />
            <NumberField.Increment className={"flex items-center justify-center select-none rounded-r-md min-w-4 bg-clip-padding" + ((value ?? 1) < (max ?? 100000000) ? " [&:not([data-disabled])]:lg:hover:bg-gray-100 [&:not([data-disabled])]:active:bg-gray-100 text-gray-900": " text-gray-400")}>
              <PlusIcon />
            </NumberField.Increment>
          </NumberField.Group>
        </div>
      </NumberField.Root>
    </FieldWithLabel>
  )
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H5M10 5H5M5 5V0M5 5V10" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H10" />
    </svg>
  );
}
