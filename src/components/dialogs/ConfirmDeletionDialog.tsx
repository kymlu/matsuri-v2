import { ChoreoSection } from "../../models/choreoSection";
import BaseEditDialog from "./BaseEditDialog";

export default function ConfirmDeletionDialog(props: {
  section?: ChoreoSection,
  onSubmit: () => void,
}) {
  const onSubmit = () => {
    props.onSubmit();
  }

  return <BaseEditDialog
    title={props.section?.name + "を削除？"}
    onSubmit={onSubmit}
    actionButtonText="OK"
    >
      <></>
  </BaseEditDialog>
}