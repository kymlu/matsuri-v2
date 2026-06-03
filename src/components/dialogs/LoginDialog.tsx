import { useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import { Oval } from "react-loader-spinner";
import { colorPalette } from "../../lib/consts/colors";

export default function LoginDialog() {
  const checkAuth = async () => {
    if (!isProcessing) {
      setIsProcessing(true);
      window.location.href = "/admin";
    }
  };

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  return <BaseEditDialog
    title="管理者ログイン"
    actionButtonText="ログイン"
    showCloseButton={false}
    onSubmit={checkAuth}
  >
    隊列表を公開するには、メール認証が必要です。
    {
      isProcessing &&
      <Oval
        wrapperClass="mt-4 justify-self-center"
        color={colorPalette.primary}
        secondaryColor={colorPalette.rainbow.red[2]}/>
    }
  </BaseEditDialog>
}