import classNames from "classnames";
import Icon from "./Icon";

// A checkbox for selection mode: empty, ticked, or a dash when only some are selected.
export default function SelectBox({ state }: { state: "none" | "some" | "all" }) {
  return <span aria-hidden className={classNames("flex items-center justify-center rounded shrink-0 size-5 border-2", {
    "border-line-strong": state === "none",
    "border-primary bg-primary": state === "all",
    "border-primary": state === "some",
  })}>
    {state === "all" && <Icon src="check" size="2xs" colour="white"/>}
    {state === "some" && <span className="w-2.5 h-0.5 bg-primary"/>}
  </span>;
}
