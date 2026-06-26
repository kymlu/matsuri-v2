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
    actionButtonText="招待"
    noDetachedTrigger
    >
    <div className="space-y-2">
      {
        !isNullOrUndefinedOrBlank(user.name) &&
        <p>{user.name}</p>
      }
      <p>{user.email}</p>
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
      <p className="text-sm text-gray-600 text-wrap">
        {role === "admin" && <>隊列表の編集とユーザー管理ができます。</>}
        {role === "editor" && <>隊列表の編集ができます。</>}
      </p>
    </div>
    {
      hasError &&
      <span className="w-full font-semibold text-center text-primary">
        処理中に問題が発生しました
      </span>
    }
  </BaseEditDialog>
}