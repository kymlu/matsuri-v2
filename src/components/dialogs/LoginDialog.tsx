import BaseEditDialog from "./BaseEditDialog";

export default function LoginDialog() {
  const checkAuth = async () => {
    window.location.href = "/admin";
  };

  return <BaseEditDialog
    title="管理者ログイン"
    actionButtonText="ログイン"
    showCloseButton={false}
    onSubmit={checkAuth}
  >
    隊列表を公開するには、メール認証が必要です。
  </BaseEditDialog>
}