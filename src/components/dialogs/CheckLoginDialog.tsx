import { useNavigate } from "react-router-dom";
import BaseEditDialog from "./BaseEditDialog";

export default function CheckLoginDialog() {
  const navigate = useNavigate();
  const checkAuth = async () => {
    navigate("/admin");
  };

  return <BaseEditDialog
    title="管理者ログイン"
    actionButtonText="ログイン"
    showCloseButton={false}
    onSubmit={checkAuth}
  >
    ファイルのアップロードには、メール認証が必要です。
  </BaseEditDialog>
}