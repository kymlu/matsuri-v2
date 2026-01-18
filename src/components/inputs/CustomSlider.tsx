import { Slider } from "@base-ui/react";
import React, { useState } from "react";
import { useImperativeHandle } from "react";
import { FieldWithLabel } from "./Label";

export type CustomSliderProps = {
  min: number,
  max: number,
  step: number,
  defaultValue: number,
  setValue: (newValue: number) => void,
  ref?: React.Ref<any>,
  label?: string,
}

export default function CustomSlider(props: CustomSliderProps) {
  const [value, setValue] = useState<number>(props.defaultValue);

  useImperativeHandle(props.ref, () => ({
    changeValue: (newValue: number) => {
      setValue(newValue);
    }
  }));

  return (
    <FieldWithLabel label={props.label}>
      <Slider.Root
        min={props.min}
        max={props.max}
        step={props.step}
        value={value}
        onValueChange={(newValue) => {
          props.setValue(newValue);
          setValue(newValue);
        }}>
        <Slider.Control className="flex items-center w-full py-3 select-none touch-none">
          <Slider.Track className="h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
            <Slider.Indicator className="rounded select-none bg-primary" />
            <Slider.Thumb className="size-4 rounded-full bg-white outline outline-2 outline-primary select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </FieldWithLabel>
  )
}