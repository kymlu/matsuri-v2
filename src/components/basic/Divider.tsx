import classNames from "classnames";

export type DividerProps = {
  compact?: boolean,
  medium?: boolean,
  primary?: boolean,
}

export default function Divider({
  compact, medium, primary
}: DividerProps) {
  const classes = classNames("border-none h-0.5", {
    "my-3": !compact && !medium,
    "my-1": medium,
    "h-0.5": compact,
    "bg-primary": primary,
    "bg-subtle": !primary,
  })

  return (
    <div>
      <hr className={classes}/>
    </div>
  )
}
export function VerticalDivider() {
  return (
    <div
      className={"mx-2 border-l h-full border-line"}
    />
  );
}
