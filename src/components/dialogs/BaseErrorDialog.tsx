import Button from "../basic/Button";
import CustomDialog, { CustomDialogProps } from "../basic/CustomDialog";
import { Dialog } from "@base-ui/react";

type BaseErrorDialogProps = {
  title: string,
  actionButtonText?: string,
  children: React.ReactNode,
  onClose?: () => void,
  fullWidth?: boolean
  focusDialogOnOpen?: CustomDialogProps["focusDialogOnOpen"],
}

export default function BaseErrorDialog({
  title, actionButtonText, children, onClose, fullWidth, focusDialogOnOpen
}: BaseErrorDialogProps) {
  return <CustomDialog
    hasX
    onClose={onClose}
    fullWidth={fullWidth}
    focusDialogOnOpen={focusDialogOnOpen}
    title={title}
    footer={
      <div className="grid w-full grid-flow-col gap-2 mt-4 auto-cols-fr">
        <Dialog.Close onClick={onClose} className="w-full">
          <Button
            asDiv
            full
            primary>
            <span className="font-semibold text-nowrap">
              {actionButtonText ?? "OK"}
            </span>
          </Button>
        </Dialog.Close>
      </div>
    }>
      <>
        {children}
      </>
      
    </CustomDialog>
}