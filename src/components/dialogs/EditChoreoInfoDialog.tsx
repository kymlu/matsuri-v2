import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Choreo } from "../../models/choreo";

export default function EditChoreoInfoDialog(props: {
  choreo?: Choreo,
  onSubmit: (name: string, event: string) => void,
}) {
  const [name, setName] = useState("");
  const [event, setEvent] = useState("");

  useEffect(() => {
    setName(props.choreo?.name ?? "");
    setEvent(props.choreo?.event ?? "");
  }, [props.choreo]);

  return <BaseEditDialog
    title="隊列情報変更"
    onSubmit={() => { props.onSubmit(name, event) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      label="名前"
      default={props.choreo?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}/>

    <TextInput
      label="イベント（任意）"
      default={props.choreo?.event ?? ""}
      onContentChange={ (newEvent) => { setEvent(newEvent) }}/>
  </BaseEditDialog>
}