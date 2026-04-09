import { useEffect, useMemo, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";

type EditNameDialogProps = {
  name?: string,
  required?: boolean,
  otherNames?: string[],
  type: "道具" | "隊列表" | "イベント" | "セクション" | "障害物",
  onSubmit: (name: string) => void,
  onClose?: () => void,
}

export default function EditNameDialog({
  name, required = true, otherNames, type, onSubmit, onClose
}: EditNameDialogProps) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setNewName(name ?? "");
  }, [name]);

  const nameCounts = useMemo(() => {
    if (!otherNames || otherNames?.length === 0) {
      return {};
    };
        
    const nameSet = new Set(otherNames);
    return Array.from(nameSet).reduce((acc, item) => {
      acc[item] = otherNames.filter(x => strEquals(x, item)).length - (strEquals(item, name) ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);
  }, [otherNames]);

  const hasDuplicate = useMemo(() => {
    return nameCounts && nameCounts[newName] !== null && nameCounts[newName] > 0;
  }, [nameCounts, newName]);

  return <BaseEditDialog
    title={`${type}名`}
    onSubmit={() => { onSubmit(newName) }}
    onClose={() => onClose?.()}
    isActionButtonDisabled={required && isNullOrUndefinedOrBlank(newName)}
    >
    <TextInput
      required={required}
      defaultValue={name ?? ""}
      onContentChange={ (newName) => { setNewName(newName) }}
      maxLength={type === "イベント" || type === "隊列表" ? 20 : 15}
      showLength/>
    
    {
      hasDuplicate && <div className="font-bold text-center text-wrap text-primary">
        この名前がすでに使用されています
      </div>
    }
  </BaseEditDialog>
}