import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
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
      defaultValue={choreo?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}/>

    <TextInput
      label="イベント（任意）"
      defaultValue={choreo?.event ?? ""}
      onContentChange={ (newEvent) => { setEvent(newEvent) }}/>
  </BaseEditDialog>
}