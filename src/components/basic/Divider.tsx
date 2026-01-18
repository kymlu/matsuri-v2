import classNames from "classnames";

export type DividerProps = {
  compact?: boolean,
  primary?: boolean,
}

export default function Divider(props: DividerProps) {
  var classes = classNames("border-none h-0.5", {
    "my-3": !props.compact,
    "h-0.5": props.compact,
    "bg-primary": props.primary,
    "bg-gray-200": !props.primary,
  })

  return (
    <div>
      <hr className={classes}/>
    </div>
  )
}