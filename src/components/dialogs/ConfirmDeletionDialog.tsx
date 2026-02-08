import { ChoreoSection } from "../../models/choreoSection";
import BaseEditDialog from "./BaseEditDialog";

type ConfirmDeletionDialogProps = {
  section?: ChoreoSection,
  onSubmit: () => void,
}

export default function ConfirmDeletionDialog({
  section, onSubmit
}: ConfirmDeletionDialogProps) {
  return <BaseEditDialog
    title={section?.name + "を削除？"}
    onSubmit={onSubmit}
    actionButtonText="OK"
    >
      <></>
  </BaseEditDialog>
}