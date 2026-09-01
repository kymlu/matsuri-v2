import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { LONG_NAME_LENGTH, SHORT_NAME_LENGTH } from "../../lib/consts/consts";

type EditNameDialogProps = {
  name?: string,
  required?: boolean,
  type: "道具" | "隊列表" | "イベント" | "セクション" | "障害物",
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
    onSubmit={() => { onSubmit(newName.trim()) }}
    onClose={() => onClose?.()}
    isActionButtonDisabled={required && isNullOrUndefinedOrBlank(newName.trim())}
    >
    <TextInput
      required={required}
      defaultValue={name ?? ""}
      onContentChange={ (newName) => { setNewName(newName) }}
      maxLength={type === "イベント" || type === "隊列表" ? LONG_NAME_LENGTH : SHORT_NAME_LENGTH}
      showLength/>
  </BaseEditDialog>
}