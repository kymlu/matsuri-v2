import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Dancer } from "../../models/dancer";

type EditDancerNameDialogProps = {
  dancer?: Dancer,
  onSubmit: (name: string) => void,
}

export default function EditDancerNameDialog({
  dancer, onSubmit
}: EditDancerNameDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(dancer?.name ?? "");
  }, [dancer]);

  return <BaseEditDialog
    title="ダンサー名"
    onSubmit={() => { onSubmit(name) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      defaultValue={dancer?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}
      maxLength={15}/>
  </BaseEditDialog>
}