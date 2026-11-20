import classNames from "classnames";

type RosterNameLabelProps = {
  name: string,
  size?: string,
  color?: string,
  showColor?: boolean,
  className?: string,
}

// A roster name, with a prop's colour before it and its size on a small line under it.
export default function RosterNameLabel({ name, size, color, showColor, className }: RosterNameLabelProps) {
  return <span className={classNames("flex items-center min-w-0 gap-2", className)}>
    {
      showColor &&
      <span aria-hidden className="inline-block border rounded-full shrink-0 size-3 border-line" style={{ backgroundColor: color }}/>
    }
    <span className="flex flex-col min-w-0">
      <span className="font-semibold [overflow-wrap:anywhere]">{name}</span>
      {size && <span className="text-xs text-muted">{size}</span>}
    </span>
  </span>;
}
