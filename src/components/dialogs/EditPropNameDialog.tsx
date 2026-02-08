import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Prop } from "../../models/prop";

type EditPropNameDialogProps = {
  prop?: Prop,
  onSubmit: (name: string) => void,
}

export default function EditPropNameDialog({
  prop, onSubmit
}: EditPropNameDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(prop?.name ?? "");
  }, [prop]);

  return <BaseEditDialog
    title="道具名"
    onSubmit={() => { onSubmit(name) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      defaultValue={prop?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}
      maxLength={15}/>
  </BaseEditDialog>
}