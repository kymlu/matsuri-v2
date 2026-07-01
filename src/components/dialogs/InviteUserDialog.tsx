import { useMemo, useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { EMAIL_LENGTH } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank, testEmail } from "../../lib/helpers/globalHelper";
import { RoleType } from "../../models/user";
import Button from "../basic/Button";
import { inviteUser } from "../../lib/helpers/apiHelper";

type InviteUserDialogProps = {
  teamName?: string,
  existingUsers: Set<string>,
  onSuccess: () => void,
}

export default function InviteUserDialog({
  teamName, existingUsers, onSuccess
}: InviteUserDialogProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<RoleType>("editor");
  const [hasError, setHasError] = useState<boolean>(false);
  const [mode, setMode] = useState<"enter" | "sent">("enter");

  const resetData = () => {
    setEmail("");
    setRole("editor");
    setHasError(false);
  }

  const isEmailValid = useMemo(() => {
    return !isNullOrUndefinedOrBlank(email) &&
      testEmail(email) && !existingUsers.has(email);
  }, [email]);

  const errorMessage = useMemo(() => {
    if (!testEmail(email)) {
      return "有効なメールアドレスを入力してください"
    } else if (existingUsers.has(email)) {
      return "このユーザーはすでに追加されています"
    }
  }, [email]);

  const onSubmit = () => {
    if (!isProcessing) {
      setIsProcessing(true);
      setHasError(false);
      try {
        // call api
        inviteUser(
          email,
          role,
          () => {
            onSuccess();
            setMode("sent");
            setIsProcessing(false);
          },
          (status) => {
            setIsProcessing(false);
            setHasError(true);
          }
        );
      } catch (e: any) {
        setIsProcessing(false);
        setHasError(true);
      }
    }
  }

  return <BaseEditDialog
    title="招待"
    onSubmit={() => onSubmit()}
    showCloseButton={mode === "enter"}
    actionButtonText={mode === "enter" ? "招待" : "OK"}
    onClose={resetData}
    isActionButtonDisabled={!isEmailValid}
    fullWidth
    >
    {
      mode === "enter" &&
      <div className="space-y-2">
        <p><b>{teamName}</b>に招待するメールアドレスを入力してください。</p>
        <TextInput
          name="メール"
          onContentChange={(newEmail) => setEmail(newEmail)}
          maxLength={EMAIL_LENGTH}
          hasError={errorMessage !== undefined}
          required
        />
        {
          errorMessage && <p className="text-sm font-bold text-wrap text-primary">
          {errorMessage}
        </p>
        }
        <div className="flex gap-2">
          <Button
            full
            primary={role === "editor"}
            onClick={() => setRole("editor")}>
            編集者
          </Button>
          <Button
            full
            primary={role === "admin"}
            onClick={() => setRole("admin")}>
            管理者
          </Button>
        </div>
        <p className="text-sm text-gray-600"><b>編集者：</b>隊列表の編集ができます。</p>
        <p className="text-sm text-gray-600"><b>管理者：</b>隊列表の編集とユーザー管理ができます。</p>
      </div>
    }
    {
      mode === "sent" &&
      <p><b>{email}</b>に招待メールを送信しました。メールが届かない場合は、迷惑メールフォルダもご確認ください。</p>
    }
    {
      isProcessing &&
      <span className="w-full font-semibold text-center text-primary">
        処理中...
      </span>
    }
    {
      hasError &&
      <span className="w-full font-semibold text-center text-primary">
        処理中に問題が発生しました
      </span>
    }
  </BaseEditDialog>
}