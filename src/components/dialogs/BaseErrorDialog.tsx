import Button from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";
import { Dialog } from "@base-ui/react";

type BaseErrorDialogProps = {
  title: string,
  actionButtonText?: string,
  children: React.ReactNode,
  header?: React.ReactNode,
  footerNote?: React.ReactNode,
  onClose?: () => void,
  fullWidth?: boolean
}

export default function BaseErrorDialog({
  title, actionButtonText, children, header, footerNote, onClose, fullWidth
}: BaseErrorDialogProps) {
  return <CustomDialog
    hasX
    onClose={onClose}
    fullWidth={fullWidth}
    title={title}
    header={header}
    footer={<>
      {footerNote}
      <div className={"flex w-full gap-2 " + (footerNote ? "mt-3" : "mt-6")}>
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
    </>}>
      <>
        {children}
      </>
      
    </CustomDialog>
}