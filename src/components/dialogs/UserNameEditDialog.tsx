import { useState, useEffect, ReactNode } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

type UserNameEditDialogProps = {
  title: string,
  description: string,
  name: string,
  onSubmit: (name: string) => void,
  // A required name can't be saved blank, and while it's still blank the dialog can't be closed.
  required?: boolean,
  note?: ReactNode,
}

// Edits one name: the account name, or the dancer name this device treats as "me".
export default function UserNameEditDialog ({
  title, description, name, onSubmit, required, note
}: UserNameEditDialogProps) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setNewName(name.trim() ?? "");
  }, [name]);

  const canClose = !required || !isNullOrUndefinedOrBlank(name);

  return <BaseEditDialog
    title={title}
    onClose={() => setNewName(name ?? "")}
    onSubmit={() => onSubmit(newName.trim())}
    noDetachedTrigger
    isActionButtonDisabled={required && isNullOrUndefinedOrBlank(newName.trim())}
    showCloseButton={canClose}
    hasX={canClose}
    >
    <div className="space-y-1">
      <p className="max-w-full w-max">{description}</p>
      <TextInput
        defaultValue={name ?? ""}
        onContentChange={ (newName) => { setNewName(newName) }}
        maxLength={SHORT_NAME_LENGTH}
        showLength/>
      {note && <p className="pt-1 text-sm text-muted">{note}</p>}
    </div>
  </BaseEditDialog>
}
