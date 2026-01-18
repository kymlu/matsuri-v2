import { Dialog } from "@base-ui/react";
import React from "react";
import { ICON } from "../../lib/consts/consts";
import Icon from "./Icon";

export type CustomDialogProps = {
  children: React.ReactNode,
  title: string,
  hasX?: boolean,
  full?: boolean
}

export default function CustomDialog(props: CustomDialogProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 bg-black transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 opacity-50 z-20" />
      <Dialog.Popup className={"fixed max-h-[70vh] overflow-auto top-1/2 z-30 left-1/2 -mt-8 min-w-64 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300" 
        + (props.full ? " w-[85svw] h-[85svh]" : "")
      }>
        <div className="flex flex-row items-center justify-between mb-4">
          <Dialog.Title className="text-lg font-bold">{props.title}</Dialog.Title>
          { props.hasX &&
            <Dialog.Close className="min-w-8">
              <Icon src={ICON.clear} alt="Close Dialog"/>
            </Dialog.Close>
          }
        </div>
        {props.children}
      </Dialog.Popup>
    </Dialog.Portal>
  )
}