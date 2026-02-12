import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank, testInvalidCharacters } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Choreo } from "../../models/choreo";

type EditChoreoInfoDialogProps = {
  choreo?: Choreo,
  onSubmit: (name: string, event: string) => void,
}

export default function EditChoreoInfoDialog({
  choreo, onSubmit
}: EditChoreoInfoDialogProps) {
  const [name, setName] = useState("");
  const [event, setEvent] = useState("");

  useEffect(() => {
    setName(choreo?.name ?? "");
    setEvent(choreo?.event ?? "");
  }, [choreo]);

  return <BaseEditDialog
    title="隊列情報変更"
    onSubmit={() => { onSubmit(name, event) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      label="名前"
      required
      defaultValue={choreo?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}
      restrictFn={(s) => !testInvalidCharacters(s)}
      />

    <TextInput
      label="イベント（任意）"
      defaultValue={choreo?.event ?? ""}
      onContentChange={ (newEvent) => { setEvent(newEvent) }}
      restrictFn={(s) => !testInvalidCharacters(s)}
      />
  </BaseEditDialog>
}