import { Dialog } from "@base-ui/react";
import CustomDialog from "../basic/CustomDialog";
import Button from "../basic/Button";
import ChoreoInfo from "../common/ChoreoInfo";
import { getJpDate } from "../../lib/helpers/dateHelper";

type ConfirmUploadDialogProps = {
  choreoName?: string,
  event?: string,
  startDate?: string,
  endDate?: string,
  currentUpdatedDate?: string,
  incomingUpdatedDate?: string,
  onCancel: () => void,
  onOverwrite: () => void,
  onCopy: () => void,
}

export default function ConfirmUploadDialog({
  choreoName, event, startDate, endDate,
  currentUpdatedDate, incomingUpdatedDate,
  onCancel, onCopy, onOverwrite
}: ConfirmUploadDialogProps) {
  return <CustomDialog
      fullWidth
      title="ファイルの重複"
      footer={
      // Safest choice first and solid; overwriting is outlined in red; cancel last.
      <div className="flex flex-col w-full gap-2 mt-4 md:flex-row-reverse">
        <Dialog.Close
          onClick={onCopy}
          className="w-full">
          <Button asDiv full primary>
            <span className="font-semibold">
              コピーを作成
            </span>
          </Button>
        </Dialog.Close>
        <Dialog.Close
          onClick={onOverwrite}
          className="w-full">
          <Button asDiv full primaryText>
            <span className="font-semibold">
              上書き
            </span>
          </Button>
        </Dialog.Close>
        <Dialog.Close
          onClick={onCancel}
          className="w-full">
          <Button asDiv full>
            <span className="font-semibold">
              キャンセル
            </span>
          </Button>
        </Dialog.Close>
      </div>
    }>
      <div className="space-y-3">
        <p>隊列名とイベントの組み合わせがすでに存在します。どうしますか？</p>
        <ChoreoInfo
          name={choreoName ?? ""}
          event={event}
          startDate={startDate}
          endDate={endDate}/>
        <div>
          <b>最終編集日時</b>
          {/* Labels may wrap anywhere so the dates always fit on one line. */}
          <div className="grid grid-cols-[minmax(0,1fr),auto] gap-x-3 gap-y-1 [&>span:nth-child(odd)]:[word-break:normal]">
            <span>現在のファイル</span>
            <span className="text-right text-nowrap">{currentUpdatedDate ? getJpDate(new Date(currentUpdatedDate)) : ""}</span>
            <span>アップロード中のファイル</span>
            <span className="text-right text-nowrap">{incomingUpdatedDate ? getJpDate(new Date(incomingUpdatedDate)) : ""}</span>
          </div>
        </div>
      </div>
    </CustomDialog>
}
