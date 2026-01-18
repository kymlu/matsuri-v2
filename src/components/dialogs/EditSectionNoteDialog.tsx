import { useEffect, useState } from "react";
import { ChoreoSection } from "../../models/choreoSection";
import BaseEditDialog from "./BaseEditDialog";
import LongTextInput from "../inputs/LongTextInput";

export default function EditSectionNoteDialog(props: {
  section?: ChoreoSection,
  onSubmit: (note: string) => void,
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(props.section?.note ?? "");
  }, [props.section]);

  const onSubmit = () => {
    props.onSubmit(note);
  }

  return <BaseEditDialog
    title="ノート変更"
    onSubmit={onSubmit}
    >
    <div className="w-[50svw] h-[50svh]">
      <LongTextInput
        name="Note Editor"
        default={props.section?.note ?? ""}
        onContentChange={ (newNote) => { setNote(newNote) }}/>
    </div>
  </BaseEditDialog>
}