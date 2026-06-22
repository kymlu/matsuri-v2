import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { loginUserToTeam } from "../../lib/helpers/apiHelper";

export type LoginDialogProps = {
  teamId: string,
  onLogin: (name: string) => void,
  onClose: () => void,
}

export default function LoginDialog({
  teamId, onLogin, onClose
}: LoginDialogProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<"none" | "error" | "loginError" | "notOnTeamError">("none");
  
  const login = async () => {
    if (!isProcessing) {
      setError("none");
      setIsProcessing(true);
      loginUserToTeam(teamId, email, password, (name) => {
        onLogin(name);
        close();
      }, (status) => {
        if (status === 401) {
          setError("loginError");
        } else if (status === 403) {
          setError("notOnTeamError");
        } else {
          setError("error");
        }
        setIsProcessing(false);
      });
    }
  };

  const close = () => {
    setError("none");
    setEmail("");
    setPassword("");
    onClose();
  }

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  return <BaseEditDialog
    title="ログイン"
    actionButtonText="ログイン"
    isActionButtonDisabled={isNullOrUndefinedOrBlank(email) || isNullOrUndefinedOrBlank(password) || isProcessing}
    showCloseButton={false}
    onClose={close}
    onSubmit={login}
  >
    <TextInput
      label="メールアドレス"
      name="メールアドレス"
      defaultValue=""
      maxLength={254}
      onContentChange={(value) => setEmail(value)}/>
    <TextInput
      label="パスワード"
      name="パスワード"
      type="password"
      defaultValue=""
      maxLength={150}
      onContentChange={(value) => setPassword(value)}/>
    {
      error === "error" &&
      <span className="w-full font-semibold text-center text-primary">
        ログインに問題がありました
      </span>
    }
    {
      error === "loginError" &&
      <span className="w-full font-semibold text-center text-primary">
        メールアドレス、またはパスワードは正しくない
      </span>
    }
    {
      error === "notOnTeamError" &&
      <span className="w-full font-semibold text-center text-primary">
        編集権限がありません
      </span>
    }
  </BaseEditDialog>
}