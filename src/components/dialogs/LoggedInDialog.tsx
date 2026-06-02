import { ICON } from "../../lib/consts/consts";
import Icon from "../basic/Icon";
import BaseEditDialog from "./BaseEditDialog";

export default function LoggedInDialog() {
  const logout = async () => {
    window.location.href = "/cdn-cgi/access/logout";
  };

  return <BaseEditDialog
    title="ログイン中"
    actionButtonText="ログアウト"
    showCloseButton={false}
    onSubmit={logout}
  >
    <p>ログインのまま、ファイルを公開できます。</p>
    <ol>
      <li>編集モード（<Icon src={ICON.edit} size="sm"/>）に切り替える</li>
      <li>設定（<Icon src={ICON.settings} size="sm"/>）アイコンをタップする</li>
      <li>「公開する」を選択する</li>
      <li>内容を確認し、「公開する」をタップする</li>
    </ol>
  </BaseEditDialog>
}