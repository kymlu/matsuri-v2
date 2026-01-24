import CustomDialog from "../basic/CustomDialog";
import { ActionButton } from "../basic/Button";
import { Dialog } from "@base-ui/react";

export default function BaseErrorDialog(props: {
  title: string,
  actionButtonText?: string,
  children: React.ReactNode,
}) {
  return <CustomDialog
    hasX
    title={props.title}
    footer={
      <div className="flex w-full gap-2 mt-4">
        <Dialog.Close className="w-full">
          <ActionButton
            asDiv
            full
            compact
            primary>
            {props.actionButtonText ?? "保存"}
          </ActionButton>
        </Dialog.Close>
      </div>
    }>
      <>
        {props.children}
      </>
      
    </CustomDialog>
}