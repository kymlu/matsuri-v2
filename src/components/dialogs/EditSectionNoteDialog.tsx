import { useEffect, useState } from "react";
import { ChoreoSection } from "../../models/choreoSection";
import BaseEditDialog from "./BaseEditDialog";
import LongTextInput from "../inputs/LongTextInput";

type EditSectionNoteDialogProps = {
  section?: ChoreoSection,
  onSubmit: (note: string) => void,
}

export default function EditSectionNoteDialog({
  section, onSubmit
}: EditSectionNoteDialogProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(section?.note ?? "");
  }, [section]);

  const onSubmitBtnClicked = () => {
    onSubmit(note);
  }

  return <BaseEditDialog
    title="ノート変更"
    onSubmit={onSubmitBtnClicked}
    >
    <div className="w-[50svw] h-[50svh]">
      <LongTextInput
        name="Note Editor"
        defaultValue={section?.note ?? ""}
        onContentChange={ (newNote) => { setNote(newNote) }}/>
    </div>
  </BaseEditDialog>
}