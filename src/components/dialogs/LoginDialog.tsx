import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { PASSWORD_LENGTH, USERNAME_LENGTH } from "../../lib/consts/consts";

type LoginDialogProps = {

}

export default function LoginDialog({
  
}: LoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<"none" | "notExists" | "wrongPassword">("none");

  const onSubmitBtnClicked = () => {
    // todo
  }

  return <BaseEditDialog
    title="ログイン"
    onSubmit={onSubmitBtnClicked}
    >
    <TextInput
      label="ユーザー名"
      onContentChange={ (newValue) => { setUsername(newValue) }}
      maxLength={USERNAME_LENGTH}/>
    <TextInput
      label="パスワード"
      onContentChange={ (newValue) => { setPassword(newValue) }}
      maxLength={PASSWORD_LENGTH}/>
    {
      <span className="font-semibold text-primary">
        {
          error === "none" && ""
        }
        {
          error === "notExists" && "ユーザー名は存在しません"
        }
        {
          error === "wrongPassword" && "パスワードは違っています"
        }
      </span>
    }
  </BaseEditDialog>
}