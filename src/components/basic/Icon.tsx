import classNames from "classnames";

export default function Icon (props: {
  src: string,
  alt: string,
  size?: "sm" | "md" | "lg",
}) {
  var iconClasses = classNames({
    "min-w-14 min-h-14 size-14 max-w-14 max-h-14": props.size === "lg",
    "min-w-10 min-h-10 size-10 max-w-10 max-h-10": props.size === undefined || props.size === "md",
    "min-w-6 min-h-6 size-6 max-w-6 max-h-6": props.size === "sm"
  });

  return <img
    src={props.src}
    alt={props.alt}
    className={iconClasses}
    />
}