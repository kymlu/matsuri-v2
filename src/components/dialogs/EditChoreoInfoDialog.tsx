import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank, testInvalidCharacters } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Choreo } from "../../models/choreo";
import CustomAutocomplete from "../inputs/CustomAutocomplete";

type EditChoreoInfoDialogProps = {
  choreo?: Choreo,
  eventList: string[],
  onClose?: () => void,
  onSubmit: (name: string, event: string) => void,
}

export default function EditChoreoInfoDialog({
  choreo, eventList, onClose, onSubmit
}: EditChoreoInfoDialogProps) {
  const [name, setName] = useState("");
  const [event, setEvent] = useState("");

  useEffect(() => {
    setName(choreo?.name ?? "");
    setEvent(choreo?.event ?? "");
  }, [choreo]);

  return <BaseEditDialog
    title="隊列情報変更"
    onClose={onClose}
    onSubmit={() => {
      onSubmit(name.trim(), event.trim())
    }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name.trim())}
    >
    <div className="w-[100svw] max-w-full md:w-full">
      <TextInput
        label="名前"
        required
        defaultValue={choreo?.name ?? ""}
        onContentChange={ (newName) => { setName(newName) }}
        restrictFn={(s) => !testInvalidCharacters(s)}
        showLength
        />

      <CustomAutocomplete
        defaultValue={choreo?.event ?? ""}
        options={eventList}
        onContentChange={newValue => setEvent(newValue)}
        placeholder="イベント名を入力してください"
        label="イベント（任意）"
        clearable
        showLength
        // restrictFn={(s) => !testInvalidCharacters(s)} // todo: after pushing the official goen change to restrict
      />
    </div>
  </BaseEditDialog>
}