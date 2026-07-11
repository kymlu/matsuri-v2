import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { verifyChoreoPassword } from "../../lib/helpers/apiHelper";
import { PASSWORD_ENTRY_LENGTH } from "../../lib/consts/consts";

export type ChoreoPasswordEntryDialogProps = {
  teamId: string,
  choreoId?: string,
  choreoName?: string,
  onSuccess: () => void,
  onClose: () => void,
}

export default function ChoreoPasswordEntryDialog({
  teamId, choreoId, choreoName, onSuccess, onClose
}: ChoreoPasswordEntryDialogProps) {
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<"none" | "error" | "incorrect">("none");
  
  const login = async () => {
    if (!isProcessing && choreoId) {
      setError("none");
      setIsProcessing(true);
      verifyChoreoPassword(teamId, choreoId, password, () => {
        onSuccess();
        close();
      }, (status) => {
        if (status === 401) {
          setError("incorrect");
        } else {
          setError("error");
        }
        setIsProcessing(false);
      });
    }
  };

  const close = () => {
    setError("none");
    setPassword("");
    onClose();
  }

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  return <BaseEditDialog
    title="パスワード入力"
    actionButtonText="確認"
    isActionButtonDisabled={isNullOrUndefinedOrBlank(password) || isProcessing}
    showCloseButton={false}
    onClose={close}
    onSubmit={login}
    fullWidth
  >
    <div className="space-y-2">
      <p><b>{choreoName}</b>を見るにはパスワードが必要です。</p>
      <p>パスワードが分からない場合は<b>振り付け師</b>に相談してください。</p>
      <TextInput
        label="パスワード"
        type="password"
        defaultValue=""
        maxLength={PASSWORD_ENTRY_LENGTH}
        onContentChange={(value) => setPassword(value)}/>
      {
        error === "error" &&
        <span className="w-full font-semibold text-center text-primary">
          処理中に問題が発生しました
        </span>
      }
      {
        error === "incorrect" &&
        <span className="w-full font-semibold text-center text-primary">
          パスワードが違います
        </span>
      }
    </div>
  </BaseEditDialog>
}
