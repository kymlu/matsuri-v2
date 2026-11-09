import { Dialog } from "@base-ui/react";
import React from "react";
import Icon from "./Icon";

export type CustomDialogProps = {
  children: React.ReactNode,
  title: string,
  header?: React.ReactNode, // stays in place above the scrolling content
  footer?: React.ReactNode,
  hasX?: boolean,
  full?: boolean
  fullWidth?: boolean
  onClose?: () => void,
  initialFocus?: Dialog.Popup.Props["initialFocus"], // where focus goes on open; Base UI's default is the first field
}

export default function CustomDialog({
  children, title, header, footer, hasX, full, fullWidth, onClose, initialFocus
}: CustomDialogProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 bg-black transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 opacity-50 z-30" />
      <Dialog.Popup initialFocus={initialFocus} className={"fixed max-h-[95svh] overflow-hidden top-1/2 z-30 left-1/2 min-w-64 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 text-body outline outline-1 outline-subtle transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0" 
        + (full ? " w-[95svw] h-[95svh]" : fullWidth ? " w-[95svw] md:w-[50svw]" : "")
      }>
        <div className="flex flex-col h-full min-h-0 max-h-[calc(95svh-3rem)]">
          <div className="flex flex-row items-center justify-between gap-4 mb-2 shrink-0">
            <Dialog.Title className="text-lg font-bold break-words text-wrap">
              {title}
            </Dialog.Title>

            {hasX && (
              <Dialog.Close
                onClick={() => {onClose?.()}}
                className="min-w-6">
                <Icon src="clear" size="sm"/>
              </Dialog.Close>
            )}
          </div>

          {
            header &&
            <div className="shrink-0">
              {header}
            </div>
          }

          <div className="flex-1 min-h-0 overflow-y-auto">
            {children}
          </div>
          {
            footer &&
            <div className="shrink-0">
              {footer}
            </div>
          }
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}