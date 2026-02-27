import { useState, useEffect } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";

type UserNameEditDialogProps = {
  name: string,
  onSubmit: (name: string) => void,
}

export default function UserNameEditDialog ({
  name, onSubmit
}: UserNameEditDialogProps) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setNewName(name ?? "");
  }, [name]);
  
  return <BaseEditDialog
    title="あなたの名前"
    onClose={() => setNewName(name ?? "")}
    onSubmit={() => onSubmit(newName)}
    noDetachedTrigger
    >
    <span>名前を入力すると、隊列内に同じ名前があれば自動で選択されます。</span>
    <TextInput
      defaultValue={name ?? ""}
      onContentChange={ (newName) => { setNewName(newName) }}
      maxLength={15}/>
  </BaseEditDialog>
}