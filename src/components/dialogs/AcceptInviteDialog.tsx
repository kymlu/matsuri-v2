import { useEffect, useMemo, useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank, testAlphanumericSymbols } from "../../lib/helpers/globalHelper";
import { acceptInvite, loginUserToTeam } from "../../lib/helpers/apiHelper";
import { MIN_PASSWORD_LENGTH, PASSWORD_LENGTH } from "../../lib/consts/consts";
import { RoleType } from "../../models/user";

export type AcceptInviteDialogProps = {
  teamId?: string,
  inputEmail: string,
  setupToken?: string | null,
  onLogin: (name: string, role: RoleType, teamMemberId: string) => void,
  onClose: () => void,
}

export default function AcceptInviteDialog({
  teamId, inputEmail, setupToken, onLogin, onClose
}: AcceptInviteDialogProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<"none" | "error" | "notOnTeamError" | string>("none");

  useEffect(() => {
    setEmail(inputEmail);
  }, [inputEmail]);

  const onAcceptInvite = async () => {
    if (!isProcessing && teamId && setupToken) {
      setIsProcessing(true);
      setError("none");
      acceptInvite(teamId, setupToken, password, () => {
        loginUserToTeam(teamId, email, password, (name, role, teamMemberId) => {
          onLogin(name, role, teamMemberId);
          close();
          setIsProcessing(false);
        }, (status) => {
          setError("error");
          setIsProcessing(false);
        });
      }, (status, message) => {
        if (status === 403) {
          setError("notOnTeamError");
        } else if (!isNullOrUndefinedOrBlank(message)) {
          setError(message);
        } else {
          setError("error");
        }
        setIsProcessing(false);
      });
    }
  }

  const close = () => {
    setError("none");
    setEmail("");
    setPassword("");
    onClose();
  }

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const isActionButtonDisabled = useMemo(() => {
    return isNullOrUndefinedOrBlank(password) || password.length < MIN_PASSWORD_LENGTH || isProcessing;
  }, [password]);

  return <BaseEditDialog
    title="アカウント初期設定"
    actionButtonText="設定"
    isActionButtonDisabled={isActionButtonDisabled}
    showCloseButton={false}
    onClose={close}
    onSubmit={onAcceptInvite}
    fullWidth
    hasX={false}
  >
    <TextInput
      name="メールアドレス"
      label="メールアドレス"
      onContentChange={() => {}}
      disabled
      defaultValue={email}/>
    <TextInput
      label="新パスワード（8~25文字）"
      name="パスワード"
      type="password"
      defaultValue=""
      maxLength={PASSWORD_LENGTH}
      restrictFn={(s) => testAlphanumericSymbols(s)}
      onContentChange={(value) => setPassword(value)}/>
    {
      error === "notOnTeamError" &&
      <span className="w-full font-semibold text-center text-primary">
        このチームに権限がありません。チームの管理者に問い合わせてください。
      </span>
    }
    {
      error === "error" &&
      <span className="w-full font-semibold text-center text-primary">
        処理中に問題が発生しました
      </span>
    }
  </BaseEditDialog>
}
