import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";

// TODO: add duplicate warning
type EditNameDialogProps = {
  name?: string,
  required?: boolean,
  type: "ダンサー" | "道具" | "隊列表" | "イベント" | "セクション",
  onSubmit: (name: string) => void,
  onClose?: () => void,
}

export default function EditNameDialog({
  name, required = true, type, onSubmit, onClose
}: EditNameDialogProps) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setNewName(name ?? "");
  }, [name]);

  return <BaseEditDialog
    title={`${type}名`}
    onSubmit={() => { onSubmit(newName) }}
    onClose={() => onClose?.()}
    isActionButtonDisabled={required && isNullOrUndefinedOrBlank(newName)}
    >
    <TextInput
      required={required}
      defaultValue={newName ?? ""}
      onContentChange={ (newName) => { setNewName(newName) }}
      maxLength={15}/>
  </BaseEditDialog>
}