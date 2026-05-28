import Button from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";
import { Dialog } from "@base-ui/react";

type BaseEditDialogProps = {
  title: string,
  isActionButtonDisabled?: boolean,
  actionButtonText?: string,
  noDetachedTrigger?: boolean,
  full?: boolean,
  showCloseButton?: boolean,
  onClose?: () => void,
  onSubmit: () => void,
  children: React.ReactNode,
}

export default function BaseEditDialog({
  title,
  isActionButtonDisabled, actionButtonText,
  noDetachedTrigger, full,
  onClose, showCloseButton = true,
  onSubmit, children
}: BaseEditDialogProps) {
  return <CustomDialog
    hasX
    full={full}
    title={title}
    onClose={onClose}
    footer={
      <div className="flex w-full gap-2 mt-4">
        {
          showCloseButton &&
          <Dialog.Close
            onClick={() => {
              onClose?.();
            }}
            className="w-full">
            <Button
              asDiv
              full
              >
              <span className="font-semibold text-nowrap">
                キャンセル
              </span>
            </Button>
          </Dialog.Close>
        }
        {
          !noDetachedTrigger &&
          <Button
            onClick={() => {onSubmit()}}
            disabled={isActionButtonDisabled}
            full
            primary>
            <span className="font-semibold text-nowrap">
              {actionButtonText ?? "保存"}
            </span>
          </Button>
        }
        {
          noDetachedTrigger &&
          <Dialog.Close className="w-full">
            <Button
              onClick={() => {onSubmit()}}
              disabled={isActionButtonDisabled}
              full
              primary
              asDiv>
              <span className="font-semibold text-nowrap">
                {actionButtonText ?? "保存"}
              </span>
            </Button>
          </Dialog.Close>
        }
      </div>
    }>
    {children}
  </CustomDialog>
}