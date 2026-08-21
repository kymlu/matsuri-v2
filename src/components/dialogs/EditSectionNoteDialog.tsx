import { useEffect, useState } from "react";
import { ChoreoSection } from "../../models/choreoSection";
import BaseEditDialog from "./BaseEditDialog";
import LongTextInput from "../inputs/LongTextInput";
import Icon from "../basic/Icon";
import Divider from "../basic/Divider";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

type EditSectionNoteDialogProps = {
  section?: ChoreoSection,
  personalNote?: string,
  onSubmit: (note: string) => void,
}

export default function EditSectionNoteDialog({
  section, personalNote, onSubmit
}: EditSectionNoteDialogProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(section?.note ?? "");
  }, [section]);

  const onSubmitBtnClicked = () => {
    onSubmit(note);
  }

  return <BaseEditDialog
    title="ノート変更"
    onSubmit={onSubmitBtnClicked}
    >
    <div className="w-[70svw] md:w-[50svw] h-[70svh] flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <Icon src="globe" size="xs" colour="grey"/>
          <span className="text-sm text-gray-600">公開メモ</span>
        </div>
        <div className="flex-1 min-h-0">
          <LongTextInput
            name="Note Editor"
            defaultValue={section?.note ?? ""}
            onContentChange={ (newNote) => { setNote(newNote) }}/>
        </div>
      </div>
      <Divider/>
      <div className="flex-none max-h-[50%] min-h-0 flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <Icon src="lock" size="xs" colour="grey"/>
          <span className="text-sm text-gray-600">自分用メモ</span>
          <span className="ml-auto text-xs text-gray-400">この端末にのみ保存</span>
        </div>
        <div className="min-h-0 overflow-y-auto">
          {
            isNullOrUndefinedOrBlank(personalNote) &&
            <p className="italic text-gray-500 break-words whitespace-pre-line text-wrap">
              メモなし
            </p>
          }
          {
            !isNullOrUndefinedOrBlank(personalNote) &&
            <p className="break-words whitespace-pre-line text-wrap">
              {personalNote}
            </p>
          }
        </div>
      </div>
    </div>
  </BaseEditDialog>
}