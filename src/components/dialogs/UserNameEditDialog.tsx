import { useState, useEffect } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

type UserNameEditDialogProps = {
  name: string,
  onSubmit: (name: string) => void,
  isLoggedIn: boolean,
}

export default function UserNameEditDialog ({
  name, onSubmit, isLoggedIn
}: UserNameEditDialogProps) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setNewName(name.trim() ?? "");
  }, [name]);
  
  return <BaseEditDialog
    title="あなたの名前"
    onClose={() => setNewName(name ?? "")}
    onSubmit={() => onSubmit(newName.trim())}
    noDetachedTrigger
    isActionButtonDisabled={isLoggedIn && isNullOrUndefinedOrBlank(newName.trim())}
    showCloseButton={!isLoggedIn || !isNullOrUndefinedOrBlank(name)}
    hasX={!isLoggedIn || !isNullOrUndefinedOrBlank(name)}
    >
    <div className="space-y-1">
      <p className="max-w-full w-max">{isLoggedIn ? "ユーザー名を入力してください。" : "名前を入力すると、隊列内に同じ名前があれば自動で選択されます。"}</p>
      <TextInput
        defaultValue={name ?? ""}
        onContentChange={ (newName) => { setNewName(newName) }}
        maxLength={SHORT_NAME_LENGTH}
        showLength/>
    </div>
  </BaseEditDialog>
}