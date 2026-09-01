import { Select } from "@base-ui/react";
import React, { useState } from "react";
import { useImperativeHandle } from "react";
import { strEquals } from "../../lib/helpers/globalHelper";
import { FieldWithLabel } from "./Label";
import Icon from "../basic/Icon";

export type CustomSelectProps = {
  /**
   * Record<value, display value>
   */
  items: Record<string, string>,
  isIcons?: boolean,
  defaultValue: string,
  disabled?: boolean,
  setSelectValue?: (newValue: string) => void,
  ref?: React.Ref<any>,
  label?: string,
}

export default function CustomSelect({
  items, isIcons, defaultValue, disabled, setSelectValue, ref, label
}: CustomSelectProps) {
  const [value, setValue] = useState<string>(defaultValue);

  useImperativeHandle(ref, () => ({
    changeValue: (newValue: string) => {
      setValue(newValue);
    }
  }));

  return (
    <FieldWithLabel label={label}>
      <Select.Root
        value={value}
        items={items}
        onValueChange={(newValue) => {
          const value = Object.entries(items).find(([display,value]) => strEquals(value, newValue))?.[0] ?? "";
          setSelectValue?.(value);
          setValue(newValue ?? "");
        }}>
        <Select.Trigger disabled={disabled} className={"flex flex-row items-center text-lg h-10 justify-between w-full p-3 rounded-md border-line border data-[popup-open]:border-primary " + (disabled ? "bg-subtle cursor-default" : "bg-surface cursor-pointer")}>
          <Select.Value>
            {isIcons ? <img className="size-8" src={value}/> : value}
          </Select.Value>
          <Select.Icon className="flex align-middle">
            <Icon size="sm" src="expandMore"/>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={4} side="bottom" className="z-50 bg-surface border rounded-md select-none border-primary">
            <Select.Popup>
              <div className="flex flex-col gap-1 p-2 max-h-[40svh] overflow-y-auto">
                { Object.entries(items).map(([itemValue, label]) => (
                  <Select.Item
                    key={itemValue}
                    value={label}
                    className="flex p-2 cursor-pointer data-[highlighted]:bg-subtle"
                  >
                    {isIcons ? <img className="size-8" src={label}/> : label}
                  </Select.Item>
                ))}
              </div>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </FieldWithLabel>
  )
}