import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { PASSWORD_LENGTH, USERNAME_LENGTH } from "../../lib/consts/consts";

type LoginDialogProps = {
  onClose: () => void,
}

export default function LoginDialog({
  onClose
}: LoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<"none" | "notExists" | "wrongPassword">("none");

  const onSubmitBtnClicked = () => {
    // todo
    onClose();
    setError("none");
  }

  return <BaseEditDialog
    title="ログイン"
    actionButtonText="ログイン"
    isActionButtonDisabled={username.length === 0 || password.length === 0}
    onSubmit={onSubmitBtnClicked}
    showCloseButton={false}
    onClose={() => {
      setUsername("");
      setPassword("");
    }}
    >
    <TextInput
      label="ユーザー名"
      onContentChange={ (newValue) => { setUsername(newValue) }}
      maxLength={USERNAME_LENGTH}/>
    <TextInput
      label="パスワード"
      onContentChange={ (newValue) => { setPassword(newValue) }}
      maxLength={PASSWORD_LENGTH}
      type="password"
      />
    {
      <span className="w-full font-semibold text-center text-primary">
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