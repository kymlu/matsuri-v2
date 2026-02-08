import Button from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";
import { Dialog } from "@base-ui/react";

type BaseErrorDialogProps = {
  title: string,
  actionButtonText?: string,
  children: React.ReactNode,
}

export default function BaseErrorDialog({
  title, actionButtonText, children
}: BaseErrorDialogProps) {
  return <CustomDialog
    hasX
    title={title}
    footer={
      <div className="flex w-full gap-2 mt-4">
        <Dialog.Close className="w-full">
          <Button
            asDiv
            full
            compact
            primary>
            {actionButtonText ?? "保存"}
          </Button>
        </Dialog.Close>
      </div>
    }>
      <>
        {children}
      </>
      
    </CustomDialog>
}