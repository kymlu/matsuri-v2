import BaseEditDialog from "./BaseEditDialog";

type ConfirmDeletionDialogProps = {
  name?: string,
  onSubmit: () => void,
}

export default function ConfirmDeletionDialog({
  name, onSubmit
}: ConfirmDeletionDialogProps) {
  return <BaseEditDialog
    title={name + "を削除しますか？"}
    onSubmit={onSubmit}
    actionButtonText="削除"
    >
      <></>
  </BaseEditDialog>
}