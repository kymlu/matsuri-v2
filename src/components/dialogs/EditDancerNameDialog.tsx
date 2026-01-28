import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Dancer } from "../../models/dancer";

export default function EditDancerNameDialog(props: {
  dancer?: Dancer,
  onSubmit: (name: string) => void,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(props.dancer?.name ?? "");
  }, [props.dancer]);

  return <BaseEditDialog
    title="ダンサー名前変更"
    onSubmit={() => { props.onSubmit(name) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      default={props.dancer?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}/>
  </BaseEditDialog>
}