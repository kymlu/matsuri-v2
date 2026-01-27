import { Dialog } from "@base-ui/react";
import React from "react";
import { ICON } from "../../lib/consts/consts";
import Icon from "./Icon";

export type CustomDialogProps = {
  children: React.ReactNode,
  title: string,
  footer?: React.ReactNode,
  hasX?: boolean,
  full?: boolean
  onClose?: () => void,
}

export default function CustomDialog(props: CustomDialogProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 bg-black transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 opacity-50 z-30" />
      <Dialog.Popup className={"fixed max-h-[95vh] overflow-hidden top-1/2 z-30 left-1/2 min-w-64 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300" 
        + (props.full ? " w-[95svw] h-[95svh]" : "")
      }>
        <div className="flex flex-col h-full min-h-0">
          <div className="flex flex-row items-center justify-between mb-4 shrink-0">
            <Dialog.Title className="text-lg font-bold">
              {props.title}
            </Dialog.Title>

            {props.hasX && (
              <Dialog.Close
                onClick={() => {props.onClose?.()}}
                className="min-w-8">
                <Icon src={ICON.clear} alt="Close Dialog" />
              </Dialog.Close>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {props.children}
          </div>
          {
            props.footer &&
            <div className="shrink-0">
              {props.footer}
            </div>
          }
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}