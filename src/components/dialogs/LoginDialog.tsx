import { useMemo, useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { loginUserToTeam, resetPassword, sendPasswordResetRequest } from "../../lib/helpers/apiHelper";
import { EMAIL_LENGTH, PASSWORD_ENTRY_LENGTH, PASSWORD_LENGTH, VERIFICATION_CODE_LENGTH } from "../../lib/consts/consts";
import { RoleType } from "../../models/user";

export type LoginDialogProps = {
  teamId: string,
  onLogin: (name: string, role: RoleType, teamMemberId: string) => void,
  onClose: () => void,
}

export default function LoginDialog({
  teamId, onLogin, onClose
}: LoginDialogProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [error, setError] = useState<"none" | "error" | "loginError" | "notOnTeamError" | "notFound" | "failedReset">("none");
  
  const [mode, setMode] = useState<"login" | "forgot" | "resetPassword">("login");

  const submit = async () => {
    switch (mode) {
      case "login":
        login();
        break;

      case "forgot":
        onForgotPassword();
        break;
        
      case "resetPassword":
        onResetPassword();
        break;
    }
  }
  
  const login = async () => {
    if (!isProcessing) {
      setIsProcessing(true);
      setError("none");
      loginUserToTeam(teamId, email, password, (name, role, teamMemberId) => {
        onLogin(name, role, teamMemberId);
        close();
        setIsProcessing(false);
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

  const onForgotPassword = async () => {
    if (!isProcessing) {
      setIsProcessing(true);
      setError("none");
      sendPasswordResetRequest(email, teamId, () => {
        setMode("resetPassword");
        setIsProcessing(false);
      }, (status) => {
        setError("error");
        setIsProcessing(false);
      });
    }
  }

  const onResetPassword = async () => {
    if (!isProcessing) {
      setIsProcessing(true);
      setError("none");
      resetPassword(email, teamId, verificationCode, password, () => {
        loginUserToTeam(teamId, email, password, (name, role, teamMemberId) => {
          onLogin(name, role, teamMemberId);
          close();
          setIsProcessing(false);
        }, (status) => {
          setError("error");
          setIsProcessing(false);
        });
      }, (status) => {
        if (status === 401) {
          setError("failedReset");
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
    setVerificationCode("");
    onClose();
    setMode("login");
  }

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const isActionButtonDisabled = useMemo(() => {
    switch (mode) {
      case "login":
        return isNullOrUndefinedOrBlank(email) || isNullOrUndefinedOrBlank(password) || isProcessing;
      case "forgot":
        return isNullOrUndefinedOrBlank(email) || isProcessing;
      case "resetPassword":
        return isNullOrUndefinedOrBlank(password) || isNullOrUndefinedOrBlank(verificationCode) || isProcessing;
    }
  }, [email, password, isProcessing]);

  const actionButtonText = useMemo(() => {
    switch (mode) {
      case "login":
        return "ログイン";
      case "forgot":
        return "認証コードを送信";
      case "resetPassword":
        return "リセット";
    }
  }, [mode]);

  return <BaseEditDialog
    title="ログイン"
    actionButtonText={actionButtonText}
    isActionButtonDisabled={isActionButtonDisabled}
    showCloseButton={false}
    onClose={close}
    onSubmit={submit}
    fullWidth
  >
    {
      mode === "login" && 
      <>
        <TextInput
          label="メールアドレス"
          name="メールアドレス"
          defaultValue=""
          maxLength={EMAIL_LENGTH}
          onContentChange={(value) => setEmail(value)}/>
        <TextInput
          label="パスワード"
          name="パスワード"
          type="password"
          defaultValue=""
          maxLength={PASSWORD_ENTRY_LENGTH}
          onContentChange={(value) => setPassword(value)}/>
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
        <button onClick={() => {
          setMode("forgot");
          setPassword("");
        }}>
          <span className="w-full font-semibold text-center underline">
            パスワードをお忘れの方はこちら
          </span>
        </button>
      </>
    }
    {
      mode === "forgot" &&
      <>
        <div>入力されたメールアドレスがチームに登録されている場合、認証コードを送信します。</div>
        
        <TextInput
          name="メールアドレス"
          defaultValue=""
          maxLength={EMAIL_LENGTH}
          onContentChange={(value) => setEmail(value)}/>
      </>
    }
    {
      mode === "resetPassword" &&
      <>
        <div>入力されたメールアドレスが登録されている場合、認証コードを送信します。10分以内に入力してください。</div>
        <TextInput
          label="コード"
          name="認証コード"
          defaultValue=""
          maxLength={VERIFICATION_CODE_LENGTH}
          onContentChange={(value) => setVerificationCode(value)}/>
        <TextInput
          label="パスワード（英数字のみ）"
          name="パスワード"
          type="password"
          defaultValue=""
          maxLength={PASSWORD_LENGTH}
          onContentChange={(value) => setPassword(value)}/>
        {
          error === "failedReset" &&
          <span className="w-full font-semibold text-center text-primary">
            パスワードを再設定できませんでした。
          </span>
        }
      </>
    }
    {
      error === "error" &&
      <span className="w-full font-semibold text-center text-primary">
        処理中に問題が発生しました
      </span>
    }
  </BaseEditDialog>
}