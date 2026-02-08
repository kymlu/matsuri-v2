import { useEffect, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { Prop } from "../../models/prop";

export default function EditPropNameDialog(props: {
  prop?: Prop,
  onSubmit: (name: string) => void,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(props.prop?.name ?? "");
  }, [props.prop]);

  return <BaseEditDialog
    title="道具名"
    onSubmit={() => { props.onSubmit(name) }}
    isActionButtonDisabled={isNullOrUndefinedOrBlank(name)}
    >
    <TextInput
      default={props.prop?.name ?? ""}
      onContentChange={ (newName) => { setName(newName) }}
      maxLength={15}/>
  </BaseEditDialog>
}