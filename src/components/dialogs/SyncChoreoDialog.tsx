import { Dialog } from "@base-ui/react";
import CustomDialog from "../basic/CustomDialog";
import Button from "../basic/Button";
import { Choreo } from "../../models/choreo";
import Divider from "../basic/Divider";
import { getDate } from "../../lib/helpers/dateHelper";

type SyncChoreoDialogProps = {
  onClose: () => void,
  onOpenSaved: () => void,
  onDuplicate: () => void,
  onDelete: () => void,
  savedChoreo?: Choreo,
  serverChoreo?: Choreo,
}

export default function SyncChoreoDialog ({
  onClose, onOpenSaved, onDuplicate, onDelete,
  savedChoreo, serverChoreo
}: SyncChoreoDialogProps) {
  return <CustomDialog
    title="確認"
    hasX
    onClose={onClose}
  >
    <div className="space-y-2">
      <div>
        <p>この隊列表には公開版とは異なる内容があります。</p>
        <p>現在の変更をどうしますか？</p>
      </div>
      <div className="py-2 bg-gray-100 border border-gray-400 rounded-md">
        <div className="flex justify-between px-2">
          <span className="font-semibold text-nowrap">編集版</span>
          <span className="text-nowrap">{savedChoreo?.lastUpdated ? getDate(new Date(savedChoreo.lastUpdated)) : ""}</span>
        </div>
        <Divider compact/>
        <div className="flex justify-between px-2">
          <span className="font-semibold text-nowrap">公開版</span>
          <span className="text-nowrap">{serverChoreo?.lastUpdated ? getDate(new Date(serverChoreo.lastUpdated)) : ""}</span>
        </div>
      </div>
      <div className="space-y-1">
        <Dialog.Close
          className="w-full"
          onClick={onDuplicate}
          >
          <Button
            asDiv
            primary
            full
            >
            <span className="font-semibold text-nowrap">
              コピーして公開版へ
            </span>
          </Button>
        </Dialog.Close>
        <Dialog.Close
          className="w-full"
          onClick={onOpenSaved}
          >
          <Button
            primaryText
            asDiv
            full
            >
            <span className="font-semibold text-nowrap">
              このまま開く
            </span>
          </Button>
        </Dialog.Close>
        <Dialog.Close
          className="w-full"
          onClick={onDelete}
          >
          <Button
            asDiv
            full
            greyText
            >
            <span className="font-semibold text-nowrap">
              破棄して最公開版へ
            </span>
          </Button>
        </Dialog.Close>
      </div>
    </div>
  </CustomDialog>
}