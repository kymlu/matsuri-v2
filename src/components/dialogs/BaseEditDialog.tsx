import Button from "../basic/Button";
import CustomDialog, { CustomDialogProps } from "../basic/CustomDialog";
import { Dialog } from "@base-ui/react";

type BaseEditDialogProps = {
  title: string,
  isActionButtonDisabled?: boolean,
  actionButtonText?: string,
  noDetachedTrigger?: boolean,
  full?: boolean,
  fullWidth?: boolean,
  showCloseButton?: boolean,
  onClose?: () => void,
  onSubmit: () => void,
  children: React.ReactNode,
  hasX?: boolean,
  initialFocus?: CustomDialogProps["initialFocus"],
  // Replaces キャンセル with a button that stays in the dialog, e.g. to back out of a confirmation step.
  backButton?: { label: string, onClick: () => void },
}

export default function BaseEditDialog({
  title,
  isActionButtonDisabled, actionButtonText,
  noDetachedTrigger, full, fullWidth,
  onClose, showCloseButton = true,
  onSubmit, children, hasX = true, initialFocus, backButton,
}: BaseEditDialogProps) {
  return <CustomDialog
    hasX={hasX}
    initialFocus={initialFocus}
    full={full}
    fullWidth={fullWidth}
    title={title}
    onClose={onClose}
    footer={
      <div className="grid w-full grid-flow-col gap-2 mt-4 auto-cols-fr">
        {
          showCloseButton && backButton &&
          <Button full onClick={backButton.onClick}>
            <span className="font-semibold text-nowrap">{backButton.label}</span>
          </Button>
        }
        {
          showCloseButton && !backButton &&
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