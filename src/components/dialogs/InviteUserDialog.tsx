import { useMemo, useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { EMAIL_LENGTH } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank, testEmail } from "../../lib/helpers/globalHelper";
import { RoleType } from "../../models/user";
import Button from "../basic/Button";
import { inviteUser } from "../../lib/helpers/apiHelper";

type InviteUserDialogProps = {
  teamId: string,
  teamName?: string,
  existingUsers: Set<string>,
  onSuccess: () => void,
  onClose: () => void,
}

export default function InviteUserDialog({
  teamId, teamName, existingUsers, onSuccess, onClose
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
    if (!isProcessing && mode === "enter") {
      setIsProcessing(true);
      setHasError(false);
      try {
        // call api
        inviteUser(
          email,
          teamId,
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
    } else if (mode === "sent") {
      onClose();
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
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">役割</span>
          <div className="grid grid-cols-2 gap-2">
            <Button full primary={role === "editor"} onClick={() => setRole("editor")}>
              編集者
            </Button>
            <Button full primary={role === "admin"} onClick={() => setRole("admin")}>
              管理者
            </Button>
          </div>
          <span className="text-sm text-gray-600">
            {role === "editor" ? "隊列表の編集・公開ができます。" : "隊列表の編集・公開とユーザー管理ができます。"}
          </span>
        </div>
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