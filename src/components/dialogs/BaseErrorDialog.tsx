import Button from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";
import { Dialog } from "@base-ui/react";

type BaseErrorDialogProps = {
  title: string,
  actionButtonText?: string,
  children: React.ReactNode,
  onClose?: () => void,
}

export default function BaseErrorDialog({
  title, actionButtonText, children, onClose
}: BaseErrorDialogProps) {
  return <CustomDialog
    hasX
    onClose={onClose}
    title={title}
    footer={
      <div className="flex w-full gap-2 mt-4">
        <Dialog.Close onClick={onClose} className="w-full">
          <Button
            asDiv
            full
            compact
            primary>
            {actionButtonText ?? "OK"}
          </Button>
        </Dialog.Close>
      </div>
    }>
      <>
        {children}
      </>
      
    </CustomDialog>
}