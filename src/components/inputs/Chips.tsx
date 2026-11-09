import classNames from "classnames";
import Icon from "../basic/Icon";

export type ChipOption = {
  value: string,
  label: string,
  count?: number,
}

const chipClasses = (selected: boolean) => classNames(
  "shrink-0 flex items-center gap-1 min-h-8 px-3 rounded-full border text-sm whitespace-nowrap",
  {
    "bg-primary border-primary text-white font-semibold": selected,
    "bg-surface border-line text-body": !selected,
  });

const rowClasses = "flex gap-1.5 overflow-x-auto pb-1";

type ChipFilterProps = {
  label: string, // for screen readers
  options: ChipOption[],
  value: string,
  onChange: (value: string) => void,
}

// Pick one, e.g. which category of names to show.
export function ChipFilter({ label, options, value, onChange }: ChipFilterProps) {
  return <div role="radiogroup" aria-label={label} className={rowClasses}>
    {
      options.map(option =>
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={chipClasses(option.value === value)}
          onClick={() => onChange(option.value)}>
          {option.label}
          {option.count !== undefined && <span className="text-xs opacity-75">{option.count}</span>}
        </button>
      )
    }
  </div>
}

type ChipTogglesProps = {
  label: string, // for screen readers
  options: ChipOption[],
  values: string[],
  onChange: (values: string[]) => void,
  wrap?: boolean,
}

// Pick any number, e.g. the categories a name belongs to. Selected chips show a check
// so they can't be mistaken for a ChipFilter.
export function ChipToggles({ label, options, values, onChange, wrap }: ChipTogglesProps) {
  return <div role="group" aria-label={label} className={wrap ? "flex flex-wrap gap-1.5" : rowClasses}>
    {
      options.map(option => {
        const selected = values.includes(option.value);
        return <button
          key={option.value}
          type="button"
          aria-pressed={selected}
          className={chipClasses(selected)}
          onClick={() => onChange(selected
            ? values.filter(v => v !== option.value)
            // keep the options' order, so categories stay in display order
            : options.map(o => o.value).filter(v => v === option.value || values.includes(v)))}>
          {selected && <Icon src="check" colour="white" size="2xs"/>}
          {option.label}
        </button>
      })
    }
  </div>
}
