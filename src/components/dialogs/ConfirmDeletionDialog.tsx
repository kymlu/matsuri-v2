import BaseEditDialog from "./BaseEditDialog";

type ConfirmDeletionDialogProps = {
  name?: string,
  note?: string,
  onSubmit: () => void,
  verb: "削除" | "取り消"
}

export default function ConfirmDeletionDialog({
  name, note, onSubmit, verb
}: ConfirmDeletionDialogProps) {
  return <BaseEditDialog
    title={`${name}を${verb}しますか？`}
    onSubmit={onSubmit}
    actionButtonText="削除"
    >
      {note ? <p className="text-sm text-muted">{note}</p> : <></>}
  </BaseEditDialog>
}
