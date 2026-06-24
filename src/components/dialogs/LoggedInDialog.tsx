import Icon from "../basic/Icon";
import BaseErrorDialog from "./BaseErrorDialog";

export default function LoggedInDialog() {
  return <BaseErrorDialog
    title="ログイン中"
    actionButtonText="ログアウト"
  >
    <p>ログインのまま、ファイルを公開できます。</p>
    <ol>
      <li className="inline-flex items-center">編集モード（<Icon src="edit" colour="primary" size="xs"/>）に切り替える</li>
      <li className="inline-flex items-center">設定（<Icon src="settings" colour="primary" size="xs"/>）アイコンをタップする</li>
      <li>「公開する」を選択する</li>
      <li>内容を確認し、「公開する」をタップする</li>
    </ol>
  </BaseErrorDialog>
}