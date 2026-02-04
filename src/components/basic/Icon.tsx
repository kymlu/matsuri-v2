import classNames from "classnames";

export default function Icon (props: {
  src: string,
  colour?: "primary",
  size?: "sm" | "md" | "lg",
}) {
  var iconClasses = classNames("font-icon", {
    "text-6xl": props.size === "lg",
    "text-4xl": props.size === undefined || props.size === "md",
    "text-2xl": props.size === "sm",
    "text-primary": props.colour === "primary",
  });

  return <span className={iconClasses}>
    {props.src}
  </span>
}