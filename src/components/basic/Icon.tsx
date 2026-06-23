import classNames from "classnames";

type IconProps = {
  src: string;
  colour?: "primary" | "black" | "grey" | "white";
  size?: "xs" | "sm" | "md" | "lg";
  crossedOut?: boolean;
  vertFlip?: boolean,
};

export default function Icon({
  src,
  colour = "black",
  size = "md",
  crossedOut = false,
  vertFlip = false,
}: IconProps) {
  var iconClasses = classNames("font-icon leading-none", {
    "text-6xl max-w-16": size === "lg",
    "text-4xl max-w-8": size === "md",
    "text-2xl max-w-6": size === "sm",
    "text-lg max-w-4": size === "xs",
    "text-white": colour === "white",
    "text-primary": colour === "primary",
    "text-black": colour === "black",
    "text-gray-600": colour === "grey",
    "scale-y-[-1]": vertFlip,
  });

  return (
    <span className="relative inline-flex items-center justify-center leading-none">
      <span className={iconClasses}>
        {src}
      </span>
      {crossedOut && (
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          preserveAspectRatio="none"
        >
          <line x1="3" y1="3" x2="17" y2="17" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="4" y1="2" x2="20" y2="18" stroke="white" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      )}
    </span>
  )
}