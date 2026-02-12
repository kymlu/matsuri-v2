import { Menu } from "@base-ui/react";
import classNames from "classnames";
import React from "react";

export type CustomMenuProps = {
  trigger: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start';
  full?: boolean;
  children: React.ReactNode;
  disabled?: boolean
}

export default function CustomMenu({
  trigger,
  position,
  full,
  children,
  disabled,
}: CustomMenuProps) {
  const triggerClassNames = classNames("lg:hover:opacity-80", {
    "w-full h-full": full,
  });

  return (
    <Menu.Root>
      <Menu.Trigger disabled={disabled} className={triggerClassNames} onClick={(e) => {e.stopPropagation()}}>
        {trigger}
        </Menu.Trigger>
      <MenuContents position={position} children={children} />
    </Menu.Root>
  )
}

type MenuContentsProps = {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start';
  children: React.ReactNode;
};

export function MenuContents({
  position,
  children,
}: MenuContentsProps) {
  return <Menu.Portal>
    <Menu.Backdrop />
    <Menu.Positioner side={position ?? "bottom"} className="z-50">
      <Menu.Popup className="p-2 bg-white border border-solid rounded-md border-primary max-h-[50svh] overflow-y-auto">
        <Menu.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
          <ArrowSvg/>
        </Menu.Arrow>
        {children}
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
}


export function MenuSeparator() {
  return (
    <Menu.Separator className="mx-1 my-1.5 h-px bg-gray-200"/>
  )
}

export interface MenuItemProps {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function MenuItem({ label, onClick, disabled = false }: MenuItemProps) {
  const itemClassNames = classNames("p-1 text-center rounded-md", {
    "opacity-50 cursor-default lg:hover:bg-white": disabled,
    "lg:hover:bg-gray-200 cursor-pointer": !disabled,
  });

  return (
    <Menu.Item
      className={itemClassNames}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick(e);
        }
      }}
    >
      {label}
    </Menu.Item>
  );
};

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-primary dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-primary"
      />
    </svg>
  );
}