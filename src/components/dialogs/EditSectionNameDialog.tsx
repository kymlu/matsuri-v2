import { useEffect, useState } from "react";
import { ChoreoSection } from "../../models/choreoSection";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";

export default function EditSectionNameDialog(props: {
  section?: ChoreoSection,
  onSubmit: (name: string) => void,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(props.section?.name ?? "");
  }, [props.section]);

  return <BaseEditDialog
    title="セクション名前変更"
    onSubmit={() => { props.onSubmit(name) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      default={props.section?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}/>
  </BaseEditDialog>
}