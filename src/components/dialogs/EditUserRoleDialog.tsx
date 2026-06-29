import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import { RoleType, User } from "../../models/user";
import Button from "../basic/Button";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { changeUserRole } from "../../lib/helpers/apiHelper";

type EditUserRoleProps = {
  teamName?: string,
  user: User,
  onSuccess: () => void,
}

export default function EditUserRoleDialog({
  user, onSuccess
}: EditUserRoleProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [role, setRole] = useState<RoleType>(user.role);
  const [hasError, setHasError] = useState<boolean>(false);

  const onSubmit = () => {
    if (!isProcessing) {
      setIsProcessing(true);
      try {
        changeUserRole(
          user.id,
          role,
          () => {
            onSuccess()
            setIsProcessing(false);
          }, (status) => {
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
    title="権限変更"
    onSubmit={() => onSubmit()}
    actionButtonText="保存"
    noDetachedTrigger
    >
    <div className="grid grid-cols-[auto,1fr] auto-rows-min gap-2">
      {
        !isNullOrUndefinedOrBlank(user.name) &&
        <>
          <span>名前：</span>
          <span className="font-bold break-all">{user.name}</span>
        </>
      }
      <span>メール：</span>
      <span className="font-bold break-all">{user.email}</span>
      <span>役割：</span>
      <span></span>
      <div className="flex col-span-2 gap-2">
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
      <span className="text-sm font-bold">編集者：</span>
      <span className="text-sm">隊列表の編集ができます。</span>
      <span className="text-sm font-bold">管理者：</span>
      <span className="text-sm">隊列表の編集とユーザー管理ができます。</span>
    </div>
    {
      hasError &&
      <span className="w-full font-semibold text-center text-primary">
        処理中に問題が発生しました
      </span>
    }
  </BaseEditDialog>
}