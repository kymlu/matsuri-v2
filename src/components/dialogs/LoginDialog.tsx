import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { loginUserToTeam } from "../../lib/helpers/apiHelper";

export type LoginDialogProps = {
  teamId: string,
}

export default function LoginDialog({
  teamId
}: LoginDialogProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  const login = async () => {
    if (!isProcessing) {
      setIsProcessing(true);
    } else {
      loginUserToTeam(teamId, email, password);
    }
  };

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  return <BaseEditDialog
    title="ログイン"
    actionButtonText="ログイン"
    isActionButtonDisabled={isNullOrUndefinedOrBlank(email) || isNullOrUndefinedOrBlank(password) || isProcessing}
    showCloseButton={false}
    onSubmit={login}
  >
    <TextInput name="メールアドレス" defaultValue="" onContentChange={(value) => setEmail(value)}/>
    <TextInput name="パスワード" type="password" defaultValue="" onContentChange={(value) => setPassword(value)}/>
  </BaseEditDialog>
}