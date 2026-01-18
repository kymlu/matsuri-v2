import CustomDialog from "../basic/CustomDialog";
import { ActionButton } from "../basic/Button";
import { Dialog } from "@base-ui/react";

export default function BaseEditDialog(props: {
  title: string,
  isActionButtonDisabled?: boolean,
  actionButtonText?: string,
  onSubmit: () => void,
  children: React.ReactNode,
}) {
  return <CustomDialog
    hasX
    title={props.title}>
      <>
        {props.children}
      </>
      <div className="flex w-full gap-2 mt-4">
        <Dialog.Close className="w-full">
          <ActionButton
            asDiv
            full
            compact
            >
            キャンセル
          </ActionButton>
        </Dialog.Close>
        <ActionButton
          asDiv
          onClick={() => {props.onSubmit()}}
          disabled={props.isActionButtonDisabled}
          full
          compact
          primary>
          {props.actionButtonText ?? "保存"}
        </ActionButton>
      </div>
    </CustomDialog>
}