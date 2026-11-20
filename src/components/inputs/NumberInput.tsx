import { NumberField } from "@base-ui/react";
import classNames from "classnames";
import React, { useImperativeHandle } from "react";
import { FieldWithLabel } from "./Label";
import Icon from "../basic/Icon";

export interface NumberInputProps {
  name?: string,
  defaultValue: number,
  min?: number,
  max?: number,
  baseStep?: number,
  buttonStep?: number,
  onChange?: (newValue: number | null) => void,
  onCommit?: (newValue: number) => void, // on blur or button release, not every keystroke
  disabled?: boolean,
  short?: boolean,
  ref?: React.Ref<any>,
  label?: string,
}

export default function NumberInput ({
  name, defaultValue, min, max, baseStep, buttonStep, onChange, onCommit, disabled, short, ref, label
}: NumberInputProps) {
  const [value, setValue] = React.useState<number | null>(defaultValue ?? 0);
  const id = React.useId();

  const round = (newValue: number | null) => {
    const step = baseStep ?? 1;
    const roundedRaw = newValue ? Math.round(newValue/step) * step : min ?? 0;
    const precision = (step.toString().split('.')[1]?.length) || 0;
    return parseFloat(roundedRaw.toFixed(precision));
  };

  useImperativeHandle(ref, () => ({
    changeValue: (newValue: number) => {
      setValue(newValue);
    }
  }));
  
  const wrapperClasses = "flex flex-row items-center justify-between w-full";
  
  return (
    <FieldWithLabel label={label}>
      <NumberField.Root
        id={id}
        name={name}
        value={value}
        onValueChange={(newValue) => {
          const rounded = round(newValue);
          setValue(rounded);
          onChange?.(rounded);
        }}
        onValueCommitted={onCommit && ((newValue) => onCommit(round(newValue)))}
        defaultValue={defaultValue}
        className="flex flex-col items-start gap-1"
        min={min ?? 0}
        max={max ?? 1000}
        step={buttonStep ?? 1}
        disabled={disabled}
        >
        <div className={wrapperClasses}>
          <NumberField.Group className={classNames("grid grid-cols-[auto,1fr,auto] w-full bg-surface data-[disabled]:bg-subtle border rounded-md border-line focus-within:border-primary", { "h-6": short, "h-10": !short })}>
            <NumberField.Decrement className={"flex items-center mx-1 justify-center select-none rounded-l-md min-w-4 bg-clip-padding" + ((value ?? 1) > (min ?? 0) ? " opacity-100" : " opacity-30")}>
              <Icon src="remove" colour="black" size="sm"/>
            </NumberField.Decrement>
            <NumberField.Input className={classNames("w-full h-full min-w-0 px-1 text-center bg-surface text-body tabular-nums focus:z-1 focus:outline-none focus:-outline-offset-1")} />
            <NumberField.Increment className={"flex items-center mx-1 justify-center select-none rounded-r-md min-w-4 bg-clip-padding" + ((value ?? 1) < (max ?? 100000000) ? " opacity-100" : " opacity-30")}>
              <Icon src="add" colour="black" size="sm"/>
            </NumberField.Increment>
          </NumberField.Group>
        </div>
      </NumberField.Root>
    </FieldWithLabel>
  )
}