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
      <div className="flex flex-col w-full gap-2 mt-4 md:flex-row">
        <Dialog.Close
          onClick={onCancel}
          className="w-full">
          <Button asDiv full>
            キャンセル
          </Button>
        </Dialog.Close>
        <Dialog.Close
          onClick={onOverwrite}
          className="w-full">
          <Button asDiv full primary>
            <span className="font-semibold">
              上書き
            </span>
          </Button>
        </Dialog.Close>

        <Dialog.Close
          onClick={onCopy}
          className="w-full">
          <Button asDiv full primary>
            <span className="font-semibold">
              コピーを作成
            </span>
          </Button>
        </Dialog.Close>
      </div>
    }>
      <p>隊列名とイベントの組み合わせがすでに存在します。どうしますか？</p>
      <ChoreoInfo
        name={choreoName ?? ""}
        event={event}
        startDate={startDate}
        endDate={endDate}/>
      <b>最終編集日時</b>
      <div className="grid grid-cols-[auto,auto]">
      <span className="text-left">現在のファイル</span>
      <span className="text-right">{currentUpdatedDate ? getJpDate(new Date(currentUpdatedDate)) : ""}</span>
      <span className="text-left">アップロード中のファイル</span>
      <span className="text-right">{incomingUpdatedDate ? getJpDate(new Date(incomingUpdatedDate)) : ""}</span>
      </div>
    </CustomDialog>
}