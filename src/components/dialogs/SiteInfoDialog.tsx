import { downloadLogs } from "../../lib/helpers/logHelper";
import Button, { IconLabelButton } from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";
import Divider from "../basic/Divider";
import Icon from "../basic/Icon";

type SiteInfoDialogProps = {
  buildInfo: string | undefined,
  goToHelpPage: () => void,
}

function InfoRow({
  icon, label, children
}: { icon: "help" | "warning" | "group", label: string, children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 py-2.5">
    <span className="flex items-center gap-2 text-sm">
      <Icon src={icon} size="sm" colour="grey"/>
      {label}
    </span>
    {children}
  </div>
}

export default function SiteInfoDialog({
  buildInfo, goToHelpPage
}: SiteInfoDialogProps) {
  return <CustomDialog fullWidth title="サイト情報" hasX>
    <div className="flex flex-col gap-2 mb-2">
      <p>お困りの際は、内容に応じて以下をご確認・ご連絡ください。</p>
      <div>
        <InfoRow icon="help" label="使い方について">
          <Button compact primary onClick={() => goToHelpPage()}>ガイドを見る</Button>
        </InfoRow>
        <Divider compact/>
        <InfoRow icon="warning" label="アプリの不具合">
          <span className="font-semibold">ケイティー</span>
        </InfoRow>
        <Divider compact/>
        <InfoRow icon="group" label="隊列の内容">
          <span className="font-semibold">振り付け師</span>
        </InfoRow>
      </div>

      <IconLabelButton label="ログをダウンロード" icon="download" onClick={downloadLogs}/>
      <span className="text-center text-gray-600">{buildInfo}</span>
    </div>
  </CustomDialog>
}