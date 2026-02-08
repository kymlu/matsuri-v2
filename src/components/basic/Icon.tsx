import classNames from "classnames";

type IconProps = {
  src: string;
  colour?: "primary" | "black" | "grey" | "white";
  size?: "xs" | "sm" | "md" | "lg";
};

export default function Icon({
  src,
  colour = "black",
  size = "md",
}: IconProps) {
  var iconClasses = classNames("font-icon", {
    "text-6xl": size === "lg",
    "text-4xl": size === undefined || size === "md",
    "text-2xl": size === "sm",
    "text-lg": size === "xs",
    "text-white": colour === "white",
    "text-primary": colour === "primary",
    "text-black": colour === "black" || colour === undefined,
    "text-gray-600": colour === "grey",
  });

  return <span className={iconClasses + " leading-none"}>
    {src}
  </span>
}