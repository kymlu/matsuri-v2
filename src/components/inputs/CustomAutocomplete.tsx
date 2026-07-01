import React, { useImperativeHandle } from "react";
import classNames from "classnames";
import { DEFAULT_NAME_LENGTH } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { FieldWithLabel } from "./Label";
import IconButton from "../basic/IconButton";
import Icon from "../basic/Icon";
import { Autocomplete } from "@base-ui/react";

export type CustomAutocompleteProps = {
  name?: string,
  defaultValue?: string,
  options: string[],
  itemToStringValueFunc?: (item: string) => string,
  listItemFormat?: (item: string) => React.ReactNode,
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
  name, options, listItemFormat, itemToStringValueFunc, defaultValue, onContentChange, placeholder,
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
      "pr-20": clearable && showLength,
      "pr-12": clearable !== showLength,
      "pr-2": !clearable && !showLength,
      "pl-10": search,
      "pl-4": !search,
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
      "mb-2": !compact && !showLength,
    },);

  return (
    <FieldWithLabel label={label} full={!compact}>
      <div className={wrapperClasses}>
        <div className="relative flex items-center gap-2">
          <Autocomplete.Root
            defaultValue={defaultValue}
            openOnInputClick
            items={options}
            onValueChange={(newValue: string) => handleChange(newValue)}
            filter={(item: string, query: string) => {return item.toLowerCase().includes(query.toLowerCase())}}
            highlightItemOnHover
            itemToStringValue={itemToStringValueFunc}
          >
            <Autocomplete.Input
              disabled={disabled}
              type="text"
              name={name}
              maxLength={maxLength ?? DEFAULT_NAME_LENGTH}
              placeholder={placeholder ?? ""}
              className={inputClasses}
            />
            <Autocomplete.Portal>
              <Autocomplete.Positioner className="z-50 outline-none" sideOffset={4}>
                <Autocomplete.Popup className="rounded-md border-primary border overflow-y-auto scroll-py-[0.5rem] py-2 overscroll-contain max-h-[min(23rem,var(--available-height))] data-[empty]:hidden w-[var(--anchor-width)] max-w-[var(--available-width)] bg-[canvas] shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                  <Autocomplete.List>
                    {(item: string) => (
                      <React.Fragment key={item}>
                        {!listItemFormat && <AutocompleteItem item={item}/>}
                        {listItemFormat && listItemFormat(item) }
                      </React.Fragment>
                    )}
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
            {
              (showLength || clearable) &&
              <div className="absolute flex items-center gap-1 right-2">
                {
                  showLength &&
                  <span className="text-sm text-gray-600 text-end">{`${value.length}/${maxLength ?? 20}`}</span>
                }
                {
                  clearable && !isNullOrUndefinedOrBlank(value) && 
                  <Autocomplete.Clear >
                    <IconButton
                      src="clear"
                      colour="primary"
                      size="sm"
                      noBorder
                      asDiv/>
                  </Autocomplete.Clear>
                }
              </div>
            }
          </Autocomplete.Root>
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
        </div>
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