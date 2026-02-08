import Button from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";
import { Dialog } from "@base-ui/react";

type BaseEditDialogProps = {
  title: string,
  isActionButtonDisabled?: boolean,
  actionButtonText?: string,
  full?: boolean,
  onClose?: () => void,
  onSubmit: () => void,
  children: React.ReactNode,
}

export default function BaseEditDialog({
  title, isActionButtonDisabled, actionButtonText, full, onClose, onSubmit, children
}: BaseEditDialogProps) {
  return <CustomDialog
    hasX
    full={full}
    title={title}
    onClose={onClose}
    footer={
      <div className="flex w-full gap-2 mt-4">
        <Dialog.Close
          onClick={() => {
            onClose?.();
          }}
          className="w-full">
          <Button
            asDiv
            full
            compact
            >
            キャンセル
          </Button>
        </Dialog.Close>
        <Button
          onClick={() => {onSubmit()}}
          disabled={isActionButtonDisabled}
          full
          compact
          primary>
          {actionButtonText ?? "保存"}
        </Button>
      </div>
    }>
      <>
        {children}
      </>
      
    </CustomDialog>
}