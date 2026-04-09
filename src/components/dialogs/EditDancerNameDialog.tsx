import { useEffect, useMemo, useState } from "react";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import CustomAutocomplete from "../inputs/CustomAutocomplete";

type EditDancerNameDialogProps = {
  name?: string,
  required?: boolean,
  otherNames?: string[],
  missingNames: string[],
  onSubmit: (name: string) => void,
  onClose?: () => void,
}

export default function EditDancerNameDialog({
  name, required = true, otherNames, missingNames, onSubmit, onClose
}: EditDancerNameDialogProps) {
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
    title={`ダンサー名`}
    onSubmit={() => { onSubmit(newName) }}
    onClose={() => onClose?.()}
    isActionButtonDisabled={required && isNullOrUndefinedOrBlank(newName)}
    >
    <CustomAutocomplete
      defaultValue={name ?? ""}
      onContentChange={ (newName) => { setNewName(newName) }}
      maxLength={15}
      options={missingNames}
      showLength
    />
    
    {
      hasDuplicate && <div className="font-bold text-center text-wrap text-primary">
        この名前がすでに使用されています
      </div>
    }
  </BaseEditDialog>
}