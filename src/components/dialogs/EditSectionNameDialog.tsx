import { useEffect, useState } from "react";
import { ChoreoSection } from "../../models/choreoSection";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";

type EditSectionNameDialogProps = {
  section?: ChoreoSection,
  onSubmit: (name: string) => void,
}

export default function EditSectionNameDialog({
  section, onSubmit
}: EditSectionNameDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(section?.name ?? "");
  }, [section]);

  return <BaseEditDialog
    title="セクション名前変更"
    onSubmit={() => { onSubmit(name) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      defaultValue={section?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}/>
  </BaseEditDialog>
}