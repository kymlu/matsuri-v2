import React, { useImperativeHandle } from "react";
import classNames from "classnames";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { FieldWithLabel } from "./Label";
import IconButton from "../basic/IconButton";
import Icon from "../basic/Icon";
import { Autocomplete } from "@base-ui/react";

export type CustomAutocompleteProps = {
  name?: string,
  defaultValue?: string,
  options: string[],
  inline?: boolean,
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
  disabled?: boolean,
  ref?: React.Ref<any>,
  maxLength?: number,
  showLength?: boolean,
  label?: string,
  rightLabel?: string,
  restrictFn?: (s: string) => boolean,
}

export default function CustomAutocomplete({
  name, options, inline, defaultValue, onContentChange, placeholder,
  search, clearable, compact, tall, short, centered,
  required, hasError, disabled, ref, maxLength,
  showLength, label, rightLabel, restrictFn
}: CustomAutocompleteProps) {
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
      "border-primary bg-primary bg-opacity-20 placeholder:text-primary": (required && isNullOrUndefinedOrBlank(value)) || hasError,
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
          <Autocomplete.Root
            openOnInputClick
            items={options}
            onValueChange={(newValue: string) => handleChange(newValue)}
            filter={(item: string, query: string) => {return item.toLowerCase().includes(query.toLowerCase())}}
            highlightItemOnHover
            inline={inline}
          >
            <div className={compact ? "max-w-32": "w-full"}>
              <Autocomplete.Input
                disabled={disabled}
                type="text"
                name={name}
                maxLength={maxLength ?? 20}
                placeholder={placeholder ?? ""}
                value={value ?? ""}
                className={inputClasses}
              />
              {
                inline &&
                <div className="h-32 mt-2 scroll-py-[0.5rem] py-2 overflow-y-auto border rounded-md overscroll-contain border-primary outline-0 ">
                  <Autocomplete.Empty className="text-center h-max">
                    一致する候補はありません
                  </Autocomplete.Empty>
                  <Autocomplete.List>
                    {(item: string) => (
                      <AutocompleteItem
                        key={item}
                        item={item}
                        onClick={() => handleChange(item)}
                        />
                    )}
                  </Autocomplete.List>
                </div>
              }
            </div>
            {
              !inline &&
              <Autocomplete.Portal>
                <Autocomplete.Positioner className="outline-none" sideOffset={4}>
                  <Autocomplete.Popup className="w-[var(--anchor-width)] max-h-[23rem] max-w-[var(--available-width)] bg-[canvas] shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                    <Autocomplete.List className="rounded-md border-primary border outline-0 overflow-y-auto scroll-py-[0.5rem] py-2 overscroll-contain max-h-[min(23rem,var(--available-height))] data-[empty]:hidden">
                      {(item: string) => (
                        <AutocompleteItem key={item} item={item}/>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            }
          </Autocomplete.Root>
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
            <Autocomplete.Clear className="absolute right-2">
              <IconButton
                src={ICON.clear}
                colour="primary"
                size="sm"
                noBorder
                asDiv/>
            </Autocomplete.Clear>
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

function AutocompleteItem(props: {item: string, onClick?: () => void}) {
  const {item, onClick} = props;
  return <Autocomplete.Item
    className="flex cursor-default items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-md data-[highlighted]:before:bg-primary data-[highlighted]:before:text-white"
    value={item}
    onClick={onClick}
  >
    {item}
  </Autocomplete.Item>
}