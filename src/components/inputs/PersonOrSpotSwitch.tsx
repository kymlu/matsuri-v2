import classNames from "classnames";
import Icon from "../basic/Icon";

// Whether something (colour, counts) goes with the person (人) or stays with the spot (立ち位置) when people change places.
export default function PersonOrSpotSwitch({ label, withPerson, onChange, compact = false }: {
  label: string,
  withPerson: boolean,
  onChange: (withPerson: boolean) => void,
  compact?: boolean,
}) {
  const sides: [boolean, string, "person" | "locationOn"][] = [[true, "人", "person"], [false, "立ち位置", "locationOn"]];
  return <span className="flex shrink-0" role="radiogroup" aria-label={label}>
    {sides.map(([value, text, icon], i) => {
      const on = withPerson === value;
      return <button key={text} type="button" role="radio" aria-checked={on} onClick={() => onChange(value)}
        className={classNames("flex items-center gap-1 px-3 text-sm border", compact ? "min-h-9" : "min-h-11",
          i === 0 ? "rounded-l-md" : "rounded-r-md -ml-px",
          on ? "relative border-primary bg-primary/5 text-primary font-bold" : "border-line")}>
        <Icon src={icon} size="2xs" colour={on ? "primary" : "black"}/>{text}
      </button>;
    })}
  </span>;
}
