import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import { RoleType, User } from "../../models/user";
import Button from "../basic/Button";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import { changeUserRole } from "../../lib/helpers/apiHelper";
import Divider from "../basic/Divider";

type EditUserRoleProps = {
  teamName: string,
  teamId: string,
  user: User,
  onSuccess: () => void,
}

export default function EditUserRoleDialog({
  teamName, teamId, user, onSuccess
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
          teamId,
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
    fullWidth
    >
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
        {!isNullOrUndefinedOrBlank(user.name) && <>
          <span className="text-muted">名前</span>
          <span className="font-medium">{user.name}</span>
        </>}
        <span className="text-muted">メール</span>
        <span className="font-medium">{user.email}</span>
      </div>

      <Divider compact/>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">役割</span>
        <div className="grid grid-cols-3 gap-2">
          <Button full primary={role === "viewer"} onClick={() => setRole("viewer")}>
            閲覧者
          </Button>
          <Button full primary={role === "editor"} onClick={() => setRole("editor")}>
            編集者
          </Button>
          <Button full primary={role === "admin"} onClick={() => setRole("admin")}>
            管理者
          </Button>
        </div>
        <span className="text-sm text-muted">
          {
            role === "viewer" ? "隊列表の編集はできますが、公開はできません（ログインしていない場合と同様）。" :
            role === "editor" ? "隊列表の編集・公開ができます。" :
            "隊列表の編集・公開とユーザー管理ができます。"
          }
        </span>
      </div>
    </div>
    {
      hasError &&
      <span className="w-full font-semibold text-center text-primary">
        処理中に問題が発生しました
      </span>
    }
  </BaseEditDialog>
}