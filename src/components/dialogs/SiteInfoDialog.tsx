import { downloadLogs } from "../../lib/helpers/logHelper";
import { IconLabelButton } from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";

type SiteInfoDialogProps = {
  buildInfo: string | undefined
}

export default function SiteInfoDialog({
  buildInfo
}: SiteInfoDialogProps) {
  return <CustomDialog fullWidth title="サイト情報" hasX>
    <div className="flex flex-col justify-center gap-2 mb-2">
      <span className="mb-2 text-center">アプリの問題がある場合は、<br/><b>ケイティー</b>まで<br/>問い合わせてください。<br/><br/>隊列自体の問題がある場合は、<br/><b>振り付け師</b>まで<br/>問い合わせてください。</span>
      <IconLabelButton label="ログをダウンロード" icon="download" primary onClick={downloadLogs}/>
      <span className="text-center text-gray-600">{buildInfo}</span>
    </div>
  </CustomDialog>
}