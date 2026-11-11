import classNames from "classnames";
import { ReactNode } from "react";
import Icon from "../basic/Icon";
import { ICON } from "../../lib/consts/consts";

// Small copies of real controls, shown inside help text so the reader sees what to tap.

export function InlineIcon({ src }: { src: keyof typeof ICON }) {
  return <span className="inline-flex items-center justify-center align-middle border rounded-md border-line bg-surface size-6 mx-0.5">
    <Icon src={src} size="xs"/>
  </span>;
}

export function InlineButton({ children, primary }: { children: ReactNode, primary?: boolean }) {
  return <span className={classNames(
    "inline-flex items-center gap-0.5 align-middle mx-0.5 px-1.5 text-sm font-semibold leading-6 border rounded-md whitespace-nowrap",
    primary ? "bg-primary-fill border-primary-fill text-white" : "bg-surface border-line text-body",
  )}>
    {children}
  </span>;
}

// 若葉マーク, the same shape as public/img/beginner.svg, coloured by the theme.
export function BeginnerMark({ className = "size-5" }: { className?: string }) {
  return <svg viewBox="0 0 512 512" className={classNames("fill-primary flex-none", className)} aria-hidden>
    <g transform="translate(51, 51) scale(0.8)">
      <path d="M256,120.07L145.016,12.742C131.953,0.102,112.594-3.492,95.844,3.586c-16.734,7.109-27.609,23.531-27.609,41.719v274c0,18.406,7.469,36.031,20.703,48.844L224.5,499.258c17.563,16.984,45.438,16.984,62.984,0l135.578-131.109c13.234-12.813,20.703-30.438,20.703-48.844v-274c0-18.188-10.875-34.609-27.609-41.719c-16.75-7.078-36.109-3.484-49.172,9.156L256,120.07z M379.844,311.414c0,6.141-2.484,12.016-6.906,16.281L256,440.805V209.008l22.219-21.5l82.438-79.719c3.25-3.156,8.109-4.063,12.281-2.281c4.188,1.766,6.906,5.875,6.906,10.422V311.414z"/>
    </g>
  </svg>;
}
