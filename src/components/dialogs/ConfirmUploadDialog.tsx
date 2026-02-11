import { Dialog } from "@base-ui/react";
import CustomDialog from "../basic/CustomDialog";
import Button from "../basic/Button";

type ConfirmUploadDialogProps = {
  choreoName?: string,
  event?: string,
  onCancel: () => void,
  onOverwrite: () => void,
  onCopy: () => void,
}

export default function ConfirmUploadDialog({
  choreoName, event, onCancel, onCopy, onOverwrite
}: ConfirmUploadDialogProps) {
  return <CustomDialog
      title="ファイルの重複"
      footer={
      <div className="flex w-full gap-2 mt-4">
        <Dialog.Close
          onClick={onCancel}
          className="w-full">
          <Button asDiv full compact>
            キャンセル
          </Button>
        </Dialog.Close>
        <Dialog.Close
          onClick={onOverwrite}
          className="w-full">
          <Button asDiv full compact primary>
            上書き
          </Button>
        </Dialog.Close>

        <Dialog.Close
          onClick={onCopy}
          className="w-full">
          <Button asDiv full compact primary>
            コピーを作成
          </Button>
        </Dialog.Close>
      </div>
    }>
      <p>同じファイルがすでに存在します。どうしますか？</p>
      <p>名前：{choreoName}</p>
      {event && <p>イベント：{event}</p>}
    </CustomDialog>
}